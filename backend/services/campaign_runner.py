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

logger = logging.getLogger(__name__)


class CampaignState:
    """Shared mutable state for tracking a running campaign."""

    def __init__(self):
        self.reset()

    def reset(self):
        self.is_running: bool = False
        self.should_stop: bool = False
        self.total: int = 0
        self.sent: int = 0
        self.failed: int = 0
        self.current_batch: int = 0
        self.total_batches: int = 0
        self.status: str = "idle"
        self.current_name: str = ""
        self.start_time: Optional[float] = None
        self.failed_list: List[Dict[str, str]] = []

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
        text = csv_bytes.decode("cp1252")     # Fallback for Excel/Windows-1252
        
    reader = csv.DictReader(io.StringIO(text))

    # Normalize column headers (case-insensitive)
    recipients = []
    for row in reader:
        # Try to find name and email columns (case-insensitive)
        normalized = {k.strip().lower(): v.strip() for k, v in row.items()}
        name = normalized.get("name", "")
        email = normalized.get("email", "")
        if name and email:
            recipients.append(Recipient(name=name, email=email))

    return recipients


async def run_campaign(
    recipients: List[Recipient],
    template_bytes: bytes,
    config: CampaignConfig,
):
    """
    Execute the full certificate email campaign.

    - Chunks recipients into batches of BATCH_SIZE
    - Generates PDFs in memory
    - Sends via ZeptoMail
    - Sleeps BATCH_DELAY_SECONDS between batches (rate limiter)
    - Tracks progress via campaign_state
    """
    settings = get_settings()
    state = campaign_state

    state.reset()
    state.is_running = True
    state.status = "running"
    state.total = len(recipients)
    state.start_time = time.time()

    batch_size = settings.BATCH_SIZE
    state.total_batches = (len(recipients) + batch_size - 1) // batch_size

    logger.info(
        "Campaign started: %d recipients, %d batches, test_mode=%s",
        len(recipients), state.total_batches, config.test_mode,
    )

    # If test mode, override all emails to admin
    if config.test_mode:
        for r in recipients:
            r.email = settings.ADMIN_EMAIL

    try:
        for batch_idx in range(state.total_batches):
            if state.should_stop:
                state.status = "stopped"
                break

            state.current_batch = batch_idx + 1
            start = batch_idx * batch_size
            end = min(start + batch_size, len(recipients))
            batch = recipients[start:end]

            # Generate PDFs for this batch
            batch_data = []
            for r in batch:
                if state.should_stop:
                    break
                state.current_name = r.name
                logger.debug("Generating PDF for: %s", r.name)
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

            # Send batch and tally results in real-time
            batch_sent = 0
            batch_failed = 0
            async for r in send_batch(
                token=settings.ZEPTOMAIL_TOKEN,
                sender_email=settings.SENDER_EMAIL,
                sender_name=settings.SENDER_NAME,
                recipients=batch_data,
                subject=config.email_subject,
                body=config.email_body,
                is_html=config.is_html,
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
                    logger.warning("Failed to send to %s <%s>: %s", r["name"], r["email"], r["error"])

            logger.info(
                "Batch %d/%d complete: %d sent, %d failed",
                state.current_batch, state.total_batches, batch_sent, batch_failed,
            )
            
            # Save progress so it survives a crash
            store.save_progress(config.start_index + state.sent + state.failed)

            # Rate limiter: sleep between batches
            if batch_idx < state.total_batches - 1 and not state.should_stop:
                await asyncio.sleep(settings.BATCH_DELAY_SECONDS)

        if not state.should_stop:
            state.status = "completed"
            store.save_progress(0)  # Reset disk progress on complete
            logger.info("Campaign completed: %d sent, %d failed", state.sent, state.failed)
        else:
            logger.info("Campaign stopped by user: %d sent, %d failed", state.sent, state.failed)

    except Exception as e:
        state.status = "error"
        state.current_name = f"Error: {str(e)}"
        logger.error("Campaign error: %s", e, exc_info=True)

    finally:
        # Save to persistent history
        if state.status in ("completed", "stopped", "error"):
            store.add_history_record({
                "id": str(uuid.uuid4()),
                "timestamp": datetime.now().isoformat(),
                "subject": config.email_subject,
                "total_sent": state.sent,
                "total_failed": state.failed,
                "status": state.status,
            })
            
        state.is_running = False
