"""
Campaign Router — Start, stop, and download failed sends.
"""

import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io

from models import CampaignConfig, Recipient
from store import store
from services.campaign_runner import campaign_state, run_campaign

router = APIRouter(prefix="/api/campaign", tags=["campaign"])


@router.post("/start")
async def start_campaign(config: CampaignConfig):
    """Launch the certificate email campaign as a background task."""
    if campaign_state.is_running:
        raise HTTPException(
            status_code=409, detail="A campaign is already running"
        )

    if not store.template_bytes:
        raise HTTPException(
            status_code=400, detail="No template uploaded yet"
        )

    if not store.recipients:
        raise HTTPException(status_code=400, detail="No CSV uploaded yet")

    # Copy recipients so the campaign can modify them (test mode)
    recipients_copy = [
        Recipient(name=r.name, email=r.email) for r in store.recipients
    ][config.start_index:]

    # Launch as asyncio task (not blocking the response)
    asyncio.create_task(
        run_campaign(
            recipients=recipients_copy,
            template_bytes=store.template_bytes,
            config=config,
        )
    )

    return {
        "message": f"Campaign started for {len(recipients_copy)} recipients",
        "total": len(recipients_copy),
        "test_mode": config.test_mode,
    }


@router.post("/stop")
async def stop_campaign():
    """Signal the running campaign to stop after the current batch."""
    if not campaign_state.is_running:
        raise HTTPException(
            status_code=400, detail="No campaign is currently running"
        )

    campaign_state.should_stop = True
    return {"message": "Stop signal sent. Campaign will halt after current batch."}


@router.get("/failed-csv")
async def download_failed_csv():
    """Download the Failed_Sends.csv for the last campaign."""
    if campaign_state.is_running:
        raise HTTPException(
            status_code=400,
            detail="Campaign is still running. Wait for completion.",
        )

    csv_bytes = campaign_state.get_failed_csv_bytes()
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=Failed_Sends.csv"
        },
    )


@router.get("/progress")
async def get_progress():
    """Poll-based progress endpoint (alternative to WebSocket)."""
    return campaign_state.get_progress().model_dump()
