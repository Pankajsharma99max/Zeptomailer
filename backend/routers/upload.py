"""
Upload Router — CSV and template image upload endpoints.

Stores uploaded data in the shared Store for
downstream use by campaign and preview services.
"""

import logging
import csv
import io
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import Response
from models import Recipient, User
from auth import get_current_user
from store import store
from services.campaign_runner import parse_csv
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/csv")
async def upload_csv(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Upload a CSV file with an 'email' column (and optional 'name' column)."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    if len(content) > 10 * 1024 * 1024: # 10MB limit
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    try:
        recipients = parse_csv(content)
    except Exception as e:
        logger.error("CSV parse error: %s", e)
        raise HTTPException(
            status_code=400, detail=f"Failed to parse CSV: {str(e)}"
        )

    # Persist to disk so data survives page refreshes
    store.save_draft_csv(user.id, content, recipients)

    if len(recipients) == 0:
        raise HTTPException(
            status_code=400,
            detail="No valid rows found. Ensure CSV has an 'email' column (a 'name' column is optional).",
        )

    return {
        "message": f"Uploaded {len(recipients)} recipients",
        "count": len(recipients),
        "sample": [
            {"name": r.name, "email": r.email}
            for r in recipients[:5]
        ],
    }


@router.post("/template")
async def upload_template(files: List[UploadFile] = File(...), user: User = Depends(get_current_user)):
    """Upload one or more JPG/PNG certificate template images."""
    allowed = (".jpg", ".jpeg", ".png")
    
    contents = []
    total_size = 0
    for file in files:
        if not any(file.filename.lower().endswith(ext) for ext in allowed):
            raise HTTPException(
                status_code=400, detail=f"File {file.filename} must be JPG or PNG"
            )

        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail=f"Image file {file.filename} is empty")
        
        contents.append(content)
        total_size += len(content)
        
    if total_size > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Files total size too large (max 50MB)")

    # Persist to disk so data survives page refreshes
    store.save_draft_template(user.id, contents)

    # Get image dimensions for the frontend (using the first page as default)
    from PIL import Image

    img = Image.open(io.BytesIO(contents[0]))
    w, h = img.size

    return {
        "message": f"{len(contents)} Templates uploaded successfully",
        "count": len(contents),
        "width": w,
        "height": h,
        "size_bytes": total_size,
    }


@router.get("/template-image")
async def get_template_image(index: int = 0, user: User = Depends(get_current_user)):
    """Serve the stored template image so the frontend can restore it after refresh."""
    template_bytes_list, _ = store.get_draft_data(user.id)
    if not template_bytes_list:
        raise HTTPException(status_code=404, detail="No template uploaded")
        
    if index >= len(template_bytes_list) or index < 0:
        raise HTTPException(status_code=404, detail="Template index out of bounds")

    template_bytes = template_bytes_list[index]

    # Detect content type
    content_type = "image/jpeg"
    if template_bytes[:8].startswith(b'\x89PNG'):
        content_type = "image/png"

    return Response(
        content=template_bytes,
        media_type=content_type,
        headers={"Cache-Control": "no-cache"},
    )
