"""
WebSocket Progress Router — Real-time campaign progress updates.
"""

import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.campaign_runner import campaign_state
from config import get_settings

settings = get_settings()

router = APIRouter(tags=["progress"])


@router.websocket("/ws/progress")
async def websocket_progress(websocket: WebSocket, token: str = None):
    """
    WebSocket endpoint that pushes progress updates every second
    while a campaign is active.
    """
    await websocket.accept()

    # Authentication
    if settings.APP_PASSWORD and token != settings.APP_PASSWORD:
        await websocket.close(code=1008) # Policy Violation
        return

    try:
        while True:
            progress = campaign_state.get_progress()
            await websocket.send_text(progress.model_dump_json())

            # Stop sending once the campaign is done
            if progress.status in ("completed", "stopped", "error"):
                # Send one final update then close
                await asyncio.sleep(0.5)
                progress = campaign_state.get_progress()
                await websocket.send_text(progress.model_dump_json())
                break

            await asyncio.sleep(1.0)

    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.close()
        except Exception:
            pass
