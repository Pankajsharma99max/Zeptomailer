"""
Campaign Runner — Orchestrator with Smart Batching & Throttling.

Processes the full recipient list in batches of N, generates PDFs in memory,
sends via ZeptoMail, and reports progress through a shared state object.
"""

import asyncio
import csv
import io
import logging
import time
import uuid
from datetime import datetime
from typing import List, Dict, Optional

from config import get_settings
from models import CampaignConfig, ProgressUpdate, Recipient
from services.pdf_engine import generate_certificate_pdf
from services.mailer import send_batch
from store import store
from database import db_cursor, get_connection

logger = logging.getLogger(__name__)


class CampaignState:
    """Shared mutable state for tracking a running campaign."""

    def __init__(self):
        self.reset()

    def reset(self):
        self.is_running: bool = False
        self.should_stop: bool = False
        self.is_paused: bool = False
        self.total: int = 0
        self.sent: int = 0
        self.failed: int = 0
        self.current_batch: int = 0
        self.total_batches: int = 0
        self.status: str = "idle"
        self.current_name: str = ""
        self.subject: str = ""
        self.start_time: Optional[float] = None
        self.failed_list: List[Dict[str, str]] = []
        self.error: Optional[str] = None

    def get_progress(self) -> ProgressUpdate:
        elapsed = time.time() - self.start_time if self.start_time else 0
        processed = self.sent + self.failed
        if processed > 0 and self.total > processed:
            rate = elapsed / processed
            remaining = (self.total - processed) * rate
        else:
            remaining = 0

        return ProgressUpdate(
            total=self.total,
            sent=self.sent,
            failed=self.failed,
            current_batch=self.current_batch,
            total_batches=self.total_batches,
            estimated_seconds_remaining=round(remaining, 1),
            status=self.status,
            current_name=self.current_name,
        )

    def get_failed_csv_bytes(self) -> bytes:
        """Generate Failed_Sends.csv in memory."""
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=["name", "email", "error"])
        writer.writeheader()
        for item in self.failed_list:
            writer.writerow(item)
        return buf.getvalue().encode("utf-8")


# Global campaign state (single campaign at a time)
campaign_state = CampaignState()


def parse_csv(csv_bytes: bytes) -> List[Recipient]:
    """Parse uploaded CSV bytes into a list of Recipients."""
    try:
        text = csv_bytes.decode("utf-8-sig")  # Handle BOM
    except UnicodeDecodeError:
        try:
            text = csv_bytes.decode("cp1252")     # Fallback for Excel/Windows-1252
        except UnicodeDecodeError:
            text = csv_bytes.decode("latin-1")   # Last resort

    reader = csv.DictReader(io.StringIO(text))

    # Normalize column headers (case-insensitive)
    recipients = []
    skipped_count = 0
    total_rows = 0
    
    for row in reader:
        total_rows += 1
        # Try to find name and email columns (case-insensitive)
        normalized = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        name = normalized.get("name", "")
        email = normalized.get("email", "").lower()
        
        # Skip if email is missing, empty, or '0' or doesn't look like an email
        if name and email and email != "0" and "@" in email:
            recipients.append(Recipient(name=name, email=email))
        else:
            skipped_count += 1

    logger.info("CSV parsed: %d/%d rows accepted (%d skipped)", len(recipients), total_rows, skipped_count)
    return recipients


async def run_campaign(
    recipients: List[Recipient],
    template_bytes: bytes,
    config: CampaignConfig,
    campaign_id: Optional[str] = None,
    is_retry_failed: bool = False,
):
    """
    Execute the full certificate email campaign.
    """
    settings = get_settings()
    state = campaign_state

    state.reset()
    
    # Fetch dynamic sender_name and initial campaign counts from DB
    sender_name = settings.SENDER_NAME
    initial_sent = 0
    initial_failed = 0
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM app_settings WHERE key = ?", ("sender_name",))
        row = cursor.fetchone()
        if row:
            sender_name = row["value"]
            
        if campaign_id:
            cursor.execute("SELECT successful_count, failed_count FROM campaigns WHERE id = ?", (campaign_id,))
            camp_row = cursor.fetchone()
            if camp_row:
                initial_sent = camp_row["successful_count"] or 0
                initial_failed = 0 if is_retry_failed else (camp_row["failed_count"] or 0)
        conn.close()
    except Exception as e:
        logger.error("Failed to fetch initial data from DB: %s", e)

    state.is_running = True
    state.status = "running"
    state.total = len(recipients)
    state.sent = 0  # Re-initialize to 0 for the *current* session
    state.start_time = time.time()
    state.subject = config.email_subject

    # Slice recipients list to start from the given index
    current_recipients = recipients[config.start_index:]
    batch_size = 500 if config.email_only else settings.BATCH_SIZE
    state.total_batches = (len(current_recipients) + batch_size - 1) // batch_size

    logger.info(
        "Campaign started: %d recipients, %d batches, test_mode=%s",
        len(recipients), state.total_batches, config.test_mode,
    )

    if config.test_mode:
        for r in recipients:
            r.email = settings.ADMIN_EMAIL

    try:
        for batch_idx in range(state.total_batches):
            while state.is_paused and not state.should_stop:
                state.status = "paused"
                await asyncio.sleep(1)

            if state.should_stop:
                state.status = "stopped"
                break
                
            state.status = "running"

            state.current_batch = batch_idx + 1
            start = batch_idx * batch_size
            end = min(start + batch_size, len(current_recipients))
            batch = current_recipients[start:end]

            batch_data = []
            for r in batch:
                if state.should_stop:
                    break
                state.current_name = r.name
                if config.email_only:
                    pdf_bytes = None
                else:
                    pdf_bytes = generate_certificate_pdf(
                        template_bytes=template_bytes,
                        name=r.name,
                        x_percent=config.x_percent,
                        y_percent=config.y_percent,
                        font_size=config.font_size,
                        font_color=config.font_color,
                        text_align=config.text_align,
                    )
                batch_data.append(
                    {"name": r.name, "email": r.email, "pdf_bytes": pdf_bytes}
                )

            if state.should_stop:
                state.status = "stopped"
                break

            batch_sent = 0
            batch_failed = 0
            async for r in send_batch(
                token=settings.ZEPTOMAIL_TOKEN,
                sender_email=settings.SENDER_EMAIL,
                sender_name=sender_name,
                recipients=batch_data,
                subject=config.email_subject,
                body=config.email_body,
                is_html=config.is_html,
                is_newsletter=config.email_only,
            ):
                if r["success"]:
                    state.sent += 1
                    batch_sent += 1
                else:
                    state.failed += 1
                    batch_failed += 1
                    state.failed_list.append(
                        {
                            "name": r["name"],
                            "email": r["email"],
                            "error": r["error"],
                        }
                    )

            logger.info("Batch %d/%d complete: %d sent, %d failed", state.current_batch, state.total_batches, batch_sent, batch_failed)
            
            # Sync progress to DB if campaign_id is provided
            if campaign_id:
                try:
                    with db_cursor() as cursor:
                        cursor.execute(
                            "UPDATE campaigns SET last_sent_count = ?, successful_count = ?, failed_count = ? WHERE id = ?",
                            (config.start_index + state.sent + state.failed, initial_sent + state.sent, initial_failed + state.failed, campaign_id)
                        )
                except Exception as e:
                    logger.error("Failed to sync progress to DB: %s", e)

            if batch_idx < state.total_batches - 1 and not state.should_stop:
                await asyncio.sleep(settings.BATCH_DELAY_SECONDS)

        if not state.should_stop:
            state.status = "completed"
        else:
            state.status = "stopped"

    except Exception as e:
        state.status = "error"
        state.error = str(e)
        state.current_name = f"Error: {str(e)}"
        logger.error("Campaign error: %s", e, exc_info=True)

    finally:
        state.is_running = False
        if campaign_id:
            # Persist failed recipients to disk
            if state.failed_list:
                try:
                    store.save_campaign_failed_recipients(campaign_id, state.failed_list)
                except Exception as e:
                    logger.error("Failed to save failed recipients to disk: %s", e)

            try:
                with db_cursor() as cursor:
                    cursor.execute(
                        "UPDATE campaigns SET status = ?, last_sent_count = ?, successful_count = ?, failed_count = ? WHERE id = ?",
                        (state.status, config.start_index + state.sent + state.failed, initial_sent + state.sent, initial_failed + state.failed, campaign_id)
                    )
            except Exception as e:
                logger.error("Failed to sync final DB status: %s", e)
