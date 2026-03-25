import asyncio
import uuid
import json
import time
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import io

from models import CampaignConfig, Recipient, User, CampaignMetadata
from store import store
from auth import get_current_user, require_admin
from database import db_cursor, get_connection
from services.campaign_runner import campaign_state, run_campaign

router = APIRouter(prefix="/api/campaign", tags=["campaign"])

@router.post("/submit")
async def submit_campaign(config: CampaignConfig, user: User = Depends(get_current_user)):
    """Worker submits a campaign for admin approval."""
    template_bytes, recipients = store.get_draft_data(user.id)
    
    if not config.email_only and not template_bytes:
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
    cursor.execute("SELECT * FROM campaigns WHERE status = 'pending' ORDER BY created_at DESC")
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
            last_sent_count=r["last_sent_count"]
        ))
    return result

@router.post("/approve/{campaign_id}")
async def approve_campaign(campaign_id: str, admin: User = Depends(require_admin)):
    """Admin approves and starts a campaign."""
    if campaign_state.is_running:
        raise HTTPException(status_code=409, detail="Another campaign is already running")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campaigns WHERE id = ? AND status = 'pending'", (campaign_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Pending campaign not found")

    config = CampaignConfig.model_validate_json(row["config"])
    template_bytes, recipients = store.get_campaign_data(campaign_id)
    
    # Update status to approved/running
    with db_cursor() as cursor:
        cursor.execute("UPDATE campaigns SET status = 'running' WHERE id = ?", (campaign_id,))

    # Launch campaign
    asyncio.create_task(
        run_campaign_wrapper(campaign_id, recipients, template_bytes, config)
    )

    return {"message": "Campaign approved and started"}

async def run_campaign_wrapper(campaign_id, recipients, template_bytes, config):
    """Wrapper to update DB status after campaign completes."""
    try:
        await run_campaign(recipients, template_bytes, config)
        final_status = "completed" if not campaign_state.should_stop else "stopped"
        if campaign_state.error:
            final_status = "error"
    except Exception:
        final_status = "error"
        
    with db_cursor() as cursor:
        cursor.execute(
            "UPDATE campaigns SET status = ?, last_sent_count = ? WHERE id = ?",
            (final_status, campaign_state.sent, campaign_id)
        )

@router.post("/stop")
async def stop_campaign(user: User = Depends(get_current_user)):
    """Signal the running campaign to stop."""
    if not campaign_state.is_running:
        raise HTTPException(status_code=400, detail="No campaign is currently running")
    
    campaign_state.should_stop = True
    return {"message": "Stop signal sent"}

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
