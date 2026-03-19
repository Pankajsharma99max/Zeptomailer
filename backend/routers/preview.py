"""
Preview Router — Generate sample certificate previews.

Picks random names from the uploaded CSV and renders them
on the template at the specified coordinates.
"""

import base64
import random
from fastapi import APIRouter, HTTPException
from models import PreviewRequest
from store import store
from services.pdf_engine import generate_certificate_image

router = APIRouter(prefix="/api/preview", tags=["preview"])


@router.post("")
async def preview_certificates(req: PreviewRequest):
    """
    Generate preview certificate images for random names.
    Returns base64-encoded JPEG images.
    """
    if not store.template_bytes:
        raise HTTPException(
            status_code=400, detail="No template uploaded yet"
        )

    if not store.recipients:
        raise HTTPException(status_code=400, detail="No CSV uploaded yet")

    # Pick random sample
    count = min(req.sample_count, len(store.recipients))
    sample = random.sample(store.recipients, count)

    previews = []
    for r in sample:
        img_bytes = generate_certificate_image(
            template_bytes=store.template_bytes,
            name=r.name,
            x_percent=req.x_percent,
            y_percent=req.y_percent,
            font_size=req.font_size,
            font_color=req.font_color,
            text_align=req.text_align,
        )
        previews.append(
            {
                "name": r.name,
                "image_base64": base64.b64encode(img_bytes).decode("utf-8"),
            }
        )

    return {"previews": previews, "count": count}
