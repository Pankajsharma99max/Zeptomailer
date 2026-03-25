from fastapi import APIRouter, Depends, HTTPException
from models import AppSettings, SettingsUpdate, User
from auth import require_admin
from database import db_cursor, get_connection
from config import get_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=AppSettings)
async def get_app_settings(admin: User = Depends(require_admin)):
    """Fetch global application settings."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM app_settings WHERE key = ?", ("sender_name",))
    row = cursor.fetchone()
    conn.close()
    
    sender_name = row["value"] if row else get_settings().SENDER_NAME
    return AppSettings(sender_name=sender_name)

@router.post("", response_model=AppSettings)
async def update_app_settings(req: SettingsUpdate, admin: User = Depends(require_admin)):
    """Update global application settings."""
    with db_cursor() as cursor:
        cursor.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
            ("sender_name", req.sender_name)
        )
    return AppSettings(sender_name=req.sender_name)
