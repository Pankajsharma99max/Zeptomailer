"""
WebSocket Progress Router — Real-time campaign progress updates.
"""

import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import time
from database import get_connection
from services.campaign_runner import campaign_state

router = APIRouter(tags=["progress"])


@router.websocket("/ws/progress")
async def websocket_progress(websocket: WebSocket):
    """
    WebSocket endpoint that pushes progress updates every second
    while a campaign is active.
    """
    token = websocket.query_params.get("token")
    await websocket.accept()

    # Authentication via token
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM sessions WHERE token = ?", (token,))
    row = cursor.fetchone()
    conn.close()

    if not row:
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
