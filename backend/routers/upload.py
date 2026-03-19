"""
Upload Router — CSV and template image upload endpoints.

Stores uploaded data in the shared Store for
downstream use by campaign and preview services.
"""

import io
import csv
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.campaign_runner import parse_csv
from models import Recipient
from store import store
from typing import List

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV file with 'name' and 'email' columns."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    store.csv_bytes = content

    try:
        store.recipients = parse_csv(content)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to parse CSV: {str(e)}"
        )

    if len(store.recipients) == 0:
        raise HTTPException(
            status_code=400,
            detail="No valid rows found. Ensure CSV has 'name' and 'email' columns.",
        )

    return {
        "message": f"Uploaded {len(store.recipients)} recipients",
        "count": len(store.recipients),
        "sample": [
            {"name": r.name, "email": r.email}
            for r in store.recipients[:5]
        ],
    }


@router.post("/template")
async def upload_template(file: UploadFile = File(...)):
    """Upload a JPG/PNG certificate template image."""
    allowed = (".jpg", ".jpeg", ".png")
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(
            status_code=400, detail="File must be JPG or PNG"
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Image file is empty")

    store.template_bytes = content

    # Get image dimensions for the frontend
    from PIL import Image

    img = Image.open(io.BytesIO(content))
    w, h = img.size

    return {
        "message": "Template uploaded successfully",
        "width": w,
        "height": h,
        "size_bytes": len(content),
    }
