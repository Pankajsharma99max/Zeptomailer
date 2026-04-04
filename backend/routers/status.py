"""
Status Router — Diagnostics and state-check endpoint.

Used by the frontend on page load to restore UI state,
and for debugging deployment issues.
"""

import os
import logging
import logging
from fastapi import APIRouter, Depends
from models import User, CampaignConfig
from auth import get_current_user
from store import store
import database
import shutil
from config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/status", tags=["status"])

# Font path (same as pdf_engine uses)
FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "fonts")
DEFAULT_FONT = os.path.join(FONT_DIR, "Roboto-Regular.ttf")


@router.get("")
async def get_status(user: User = Depends(get_current_user)):
    """
    Return the current state of the application.
    Frontend calls this on mount to restore UI after a refresh.
    """
    settings = get_settings()

    status = store.get_draft_state(user.id)

    # Add deployment diagnostics
    status["zeptomail_configured"] = bool(settings.ZEPTOMAIL_TOKEN)
    status["sender_email"] = settings.SENDER_EMAIL
    status["font_available"] = os.path.isfile(DEFAULT_FONT)
    status["font_path"] = os.path.abspath(DEFAULT_FONT)

    logger.info("Status check: template=%s, csv=%s, recipients=%d",
                status["template_loaded"], status["csv_loaded"], status["recipient_count"])

    return status

from services.campaign_runner import campaign_state
from datetime import datetime
from database import get_connection, db_cursor

@router.get("/history")
async def get_history():
    """Return the history of past campaigns from DB."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, created_at, config, total_count, last_sent_count, successful_count, failed_count, status FROM campaigns ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for r in rows:
        try:
            config = CampaignConfig.model_validate_json(r["config"])
            subject = config.email_subject
            start_index = getattr(config, 'start_index', 0)
        except Exception:
            subject = "Unknown Campaign"
            start_index = 0
            
        history.append({
            "id": r["id"],
            "timestamp": datetime.fromtimestamp(r["created_at"]).isoformat(),
            "subject": subject,
            "start_index": start_index,
            "total_sent": r["successful_count"] if (r["successful_count"] > 0 or r["failed_count"] > 0) else r["last_sent_count"],
            "total_failed": r["failed_count"] if (r["successful_count"] > 0 or r["failed_count"] > 0) else max(0, r["total_count"] - r["last_sent_count"]),
            "status": r["status"]
        })
        
    if campaign_state.is_running:
        timestamp = (
            datetime.fromtimestamp(campaign_state.start_time).isoformat()
            if campaign_state.start_time
            else datetime.now().isoformat()
        )
        history.insert(0, {
            "id": "current-running",
            "timestamp": timestamp,
            "subject": getattr(campaign_state, "subject", "Current Campaign"),
            "total_sent": campaign_state.sent,
            "total_failed": campaign_state.failed,
            "status": "running"
        })
    return history

@router.delete("/history")
async def clear_history(user: User = Depends(get_current_user)):
    """Clear all campaign history from DB and disk."""
    logger.info(f"User {user.username} is clearing entire campaign history")
    with db_cursor() as cursor:
        cursor.execute("DELETE FROM campaigns")
    
    # Also clear campaign files from disk
    campaigns_dir = os.path.join(database.DATA_DIR, "campaigns")
    if os.path.exists(campaigns_dir):
        try:
            shutil.rmtree(campaigns_dir)
            os.makedirs(campaigns_dir, exist_ok=True)
            logger.info("Cleared all campaign files from disk")
        except Exception as e:
            logger.error(f"Failed to clear campaign files: {e}")
            
    return {"message": "History cleared successfully"}

@router.delete("/history/{campaign_id}")
async def delete_history_item(campaign_id: str, user: User = Depends(get_current_user)):
    """Delete a single campaign history from DB and disk."""
    logger.info(f"User {user.username} is deleting campaign {campaign_id}")
    with db_cursor() as cursor:
        cursor.execute("DELETE FROM campaigns WHERE id = ?", (campaign_id,))
    
    # Also delete campaign files from disk
    camp_dir = os.path.join(database.DATA_DIR, "campaigns", campaign_id)
    if os.path.exists(camp_dir):
        try:
            shutil.rmtree(camp_dir)
            logger.info(f"Deleted files for campaign {campaign_id}")
        except Exception as e:
            logger.error(f"Failed to delete files for campaign {campaign_id}: {e}")

    return {"message": "History item deleted successfully"}
