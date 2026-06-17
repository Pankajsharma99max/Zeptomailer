import asyncio
import uuid
import json
import time
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import io

from config import get_settings
from models import CampaignConfig, Recipient, User, CampaignMetadata
from store import store
from auth import get_current_user, require_admin
from database import db_cursor, get_connection
from services.campaign_runner import campaign_state, run_campaign
from services.pdf_engine import generate_certificate_pdf
from services.mailer import send_single_email

router = APIRouter(prefix="/api/campaign", tags=["campaign"])

@router.post("/submit")
async def submit_campaign(config: CampaignConfig, user: User = Depends(get_current_user)):
    """Worker submits a campaign for admin approval."""
    template_bytes_list, recipients = store.get_draft_data(user.id)
    
    if not config.email_only and not template_bytes_list:
        raise HTTPException(status_code=400, detail="No template uploaded yet")
    if not recipients:
        raise HTTPException(status_code=400, detail="No CSV uploaded yet")

    campaign_id = str(uuid.uuid4())
    
    # Save campaign metadata to DB
    with db_cursor() as cursor:
        cursor.execute(
            """INSERT INTO campaigns (id, creator_id, status, config, created_at, total_count)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (campaign_id, user.id, "pending", config.model_dump_json(), time.time(), len(recipients))
        )
    
    # Promote files from draft to persistent campaign storage
    store.promote_draft_to_campaign(user.id, campaign_id)
    
    return {"message": "Campaign submitted for approval", "campaign_id": campaign_id}

@router.get("/pending", response_model=list[CampaignMetadata])
async def list_pending_campaigns(admin: User = Depends(require_admin)):
    """Admin lists all campaigns awaiting approval."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campaigns WHERE (status = 'pending' OR status = 'error' OR status = 'stopped') ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append(CampaignMetadata(
            id=r["id"],
            creator_id=r["creator_id"],
            status=r["status"],
            config=CampaignConfig.model_validate_json(r["config"]),
            created_at=r["created_at"],
            total_count=r["total_count"],
            last_sent_count=r["last_sent_count"],
            successful_count=r["successful_count"] if "successful_count" in r.keys() else 0,
            failed_count=r["failed_count"] if "failed_count" in r.keys() else 0
        ))
    return result

@router.post("/approve/{campaign_id}")
async def approve_campaign(campaign_id: str, admin: User = Depends(require_admin)):
    """Admin approves and starts a campaign."""
    if campaign_state.is_running:
        raise HTTPException(status_code=409, detail="Another campaign is already running")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campaigns WHERE id = ? AND (status = 'pending' OR status = 'error' OR status = 'stopped')", (campaign_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Pending campaign not found")

    config = CampaignConfig.model_validate_json(row["config"])
    if row["status"] in ["error", "stopped"]:
        config.start_index = row["last_sent_count"] or 0
        # Update the config in the database as well so it's persisted
        with db_cursor() as cursor:
            cursor.execute("UPDATE campaigns SET config = ? WHERE id = ?", (config.model_dump_json(), campaign_id))
    template_bytes_list, recipients = store.get_campaign_data(campaign_id)
    
    # Update status to approved/running
    with db_cursor() as cursor:
        cursor.execute("UPDATE campaigns SET status = 'running' WHERE id = ?", (campaign_id,))

    # Launch campaign
    asyncio.create_task(
        run_campaign_wrapper(campaign_id, recipients, template_bytes_list, config)
    )

    return {"message": "Campaign approved and started"}

@router.post("/reject/{campaign_id}")
async def reject_campaign(campaign_id: str, admin: User = Depends(require_admin)):
    """Admin rejects a pending campaign."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM campaigns WHERE id = ?", (campaign_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if row["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending campaigns can be rejected")

    with db_cursor() as cursor:
        cursor.execute("UPDATE campaigns SET status = 'rejected' WHERE id = ?", (campaign_id,))

    return {"message": "Campaign rejected"}

async def run_campaign_wrapper(campaign_id, recipients, template_bytes_list, config, is_retry_failed=False):
    """Wrapper to update DB status after campaign completes."""
    await run_campaign(recipients, template_bytes_list, config, campaign_id=campaign_id, is_retry_failed=is_retry_failed)

@router.get("/progress")
async def get_campaign_progress(user: User = Depends(get_current_user)):
    """Polling fallback for campaign progress (mirrors the /ws/progress payload)."""
    return campaign_state.get_progress()

@router.post("/test-single")
async def test_single(config: CampaignConfig, user: User = Depends(get_current_user)):
    """Send a single test email (with certificate if applicable) to the admin address."""
    settings = get_settings()
    template_bytes_list, recipients = store.get_draft_data(user.id)

    if not config.email_only and not template_bytes_list:
        raise HTTPException(status_code=400, detail="No template uploaded yet")

    recipient = recipients[0] if recipients else Recipient(name="Test User", email="test@example.com")

    pdf_bytes = None
    if not config.email_only and config.placeholders:
        recipient_data = {
            "name": recipient.name,
            "email": recipient.email,
        }
        pdf_bytes = await asyncio.to_thread(
            generate_certificate_pdf,
            templates_bytes=template_bytes_list,
            data=recipient_data,
            placeholders=[
                p.model_dump() if hasattr(p, 'model_dump') else dict(p)
                for p in config.placeholders
            ],
        )

    # Use the dynamic sender name from app settings when available
    sender_name = settings.SENDER_NAME
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM app_settings WHERE key = ?", ("sender_name",))
    row = cursor.fetchone()
    conn.close()
    if row:
        sender_name = row["value"]

    success, error = await send_single_email(
        token=settings.ZEPTOMAIL_TOKEN,
        sender_email=settings.SENDER_EMAIL,
        sender_name=sender_name,
        recipient_email=settings.ADMIN_EMAIL,
        recipient_name=recipient.name,
        subject=config.email_subject,
        body=config.email_body,
        pdf_bytes=pdf_bytes,
        filename=f"{recipient.name}_Certificate.pdf",
        is_html=config.is_html,
    )

    if not success:
        raise HTTPException(status_code=502, detail=f"Test send failed: {error}")
    return {"message": f"Test email sent to {settings.ADMIN_EMAIL}"}

@router.post("/stop")
async def stop_campaign(user: User = Depends(get_current_user)):
    """Signal the running campaign to stop."""
    if not campaign_state.is_running:
        raise HTTPException(status_code=400, detail="No campaign is currently running")
    
    campaign_state.should_stop = True
    return {"message": "Stop signal sent"}

@router.post("/pause")
async def pause_campaign(user: User = Depends(get_current_user)):
    """Pause the running campaign."""
    if not campaign_state.is_running:
        raise HTTPException(status_code=400, detail="No campaign is currently running")
    
    campaign_state.is_paused = True
    return {"message": "Campaign paused"}

@router.post("/resume")
async def resume_campaign(user: User = Depends(get_current_user)):
    """Resume the paused campaign."""
    if not campaign_state.is_running:
        raise HTTPException(status_code=400, detail="No campaign is currently running")
    
    campaign_state.is_paused = False
    return {"message": "Campaign resumed"}

@router.get("/failed-csv")
async def download_failed_csv(user: User = Depends(get_current_user)):
    if campaign_state.is_running:
        raise HTTPException(status_code=400, detail="Campaign is still running")
    
    csv_bytes = campaign_state.get_failed_csv_bytes()
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=Failed_Sends.csv"},
    )

@router.post("/retry-failed/{campaign_id}")
async def retry_failed_campaign(campaign_id: str, admin: User = Depends(require_admin)):
    """Admin retries failed recipients for a campaign."""
    if campaign_state.is_running:
        raise HTTPException(status_code=409, detail="Another campaign is already running")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")

    failed_recipients = store.get_campaign_failed_recipients(campaign_id)
    if not failed_recipients:
        raise HTTPException(status_code=400, detail="No failed recipients found for this campaign")

    config = CampaignConfig.model_validate_json(row["config"])
    # Reset start_index for retry run because we are only passing failed recipients
    config.start_index = 0
    
    template_bytes_list, _ = store.get_campaign_data(campaign_id)
    
    # Update status to running
    with db_cursor() as cursor:
        cursor.execute("UPDATE campaigns SET status = 'running' WHERE id = ?", (campaign_id,))

    # Launch campaign for failed recipients only
    asyncio.create_task(
        run_campaign_wrapper(campaign_id, failed_recipients, template_bytes_list, config, is_retry_failed=True)
    )

    return {"message": "Retry for failed recipients started"}
