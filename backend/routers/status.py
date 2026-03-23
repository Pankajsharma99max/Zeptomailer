"""
Status Router — Diagnostics and state-check endpoint.

Used by the frontend on page load to restore UI state,
and for debugging deployment issues.
"""

import os
import logging
from fastapi import APIRouter
from store import store
from config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/status", tags=["status"])

# Font path (same as pdf_engine uses)
FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "fonts")
DEFAULT_FONT = os.path.join(FONT_DIR, "Roboto-Regular.ttf")


@router.get("")
async def get_status():
    """
    Return the current state of the application.
    Frontend calls this on mount to restore UI after a refresh.
    """
    settings = get_settings()

    status = store.get_status()

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

@router.get("/history")
async def get_history():
    """Return the history of past campaigns."""
    history = store.history.copy()
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
async def clear_history():
    """Clear all campaign history."""
    store.clear_history()
    return {"message": "History cleared successfully"}
