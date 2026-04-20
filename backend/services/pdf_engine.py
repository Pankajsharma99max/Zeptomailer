"""
Zero-Disk PDF Generation Engine.

Uses Pillow to draw names on certificate templates and ReportLab
to wrap the result as a PDF — all entirely in memory via BytesIO.
"""

import io
import os
import logging
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import landscape
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib.utils import ImageReader

logger = logging.getLogger(__name__)

# Path to the bundled fonts
FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "fonts")

def get_font_file(family: str, bold: bool) -> str:
    """Resolve font family and weight to a file path."""
    # Simplified mapping
    font_name = "Roboto-Regular"
    if family.lower() == "serif":
        # Fallback to system fonts if possible, or stay with Roboto
        font_name = "Roboto-Regular" 
    elif family.lower() == "mono":
        font_name = "Roboto-Regular"
    
    if bold:
        # Check if bold version exists, otherwise fallback to regular
        bold_path = os.path.join(FONT_DIR, f"{font_name.replace('-Regular', '')}-Bold.ttf")
        if os.path.isfile(bold_path):
            return bold_path
            
    return os.path.join(FONT_DIR, f"{font_name}.ttf")


def _hex_to_rgb(hex_color: str) -> tuple:
    """Convert '#RRGGBB' to (R, G, B) tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def generate_certificate_image(
    template_bytes: bytes,
    name: str,
    x_percent: float,
    y_percent: float,
    font_size: int = 48,
    font_color: str = "#000000",
    text_align: str = "center",
    is_bold: bool = False,
    font_family: str = "Roboto",
) -> bytes:
    """
    Draw a name on the certificate template and return JPEG bytes.

    Coordinates are given as percentages (0–100) of the image dimensions
    so the frontend can send resolution-independent values.

    text_align: "left" | "center" | "right"
      - left: text starts at x
      - center: text is centered on x
      - right: text ends at x
    """
    img = Image.open(io.BytesIO(template_bytes)).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Load font
    font_path = get_font_file(font_family, is_bold)
    try:
        font = ImageFont.truetype(font_path, font_size)
    except OSError as e:
        logger.warning("Could not load font %s (size=%d): %s — using default", font_path, font_size, e)
        font = ImageFont.load_default()

    # Translate percentage coords → pixel coords
    px_x = int((x_percent / 100) * img.width)
    px_y = int((y_percent / 100) * img.height)

    # Measure text
    bbox = draw.textbbox((0, 0), name, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    # Apply alignment
    if text_align == "left":
        draw_x = px_x
    elif text_align == "right":
        draw_x = px_x - text_w
    else:  # center (default)
        draw_x = px_x - text_w // 2

    draw_y = px_y - text_h // 2

    color = _hex_to_rgb(font_color)
    draw.text((draw_x, draw_y), name, font=font, fill=color)

    # Save to JPEG in memory
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    buf.seek(0)
    return buf.getvalue()


def generate_certificate_pdf(
    templates_bytes: list[bytes],
    name: str,
    x_percent: float,
    y_percent: float,
    font_size: int = 48,
    font_color: str = "#000000",
    text_align: str = "center",
    is_bold: bool = False,
    font_family: str = "Roboto",
    placeholder_pages: list[bool] = None,
) -> bytes:
    """
    Generate a multi-page PDF certificate entirely in memory.
    """
    # Treat None or empty list the same: draw name on every page
    if not placeholder_pages:
        placeholder_pages = [True] * len(templates_bytes)

    pdf_buf = io.BytesIO()
    c = None

    for i, t_bytes in enumerate(templates_bytes):
        # Default to True for any page index beyond the list
        has_placeholder = placeholder_pages[i] if i < len(placeholder_pages) else True
        
        if has_placeholder:
            # Draw name on template via Pillow
            jpeg_bytes = generate_certificate_image(
                t_bytes, name, x_percent, y_percent, font_size, font_color, text_align, is_bold, font_family
            )
        else:
            # Use original image
            img = Image.open(io.BytesIO(t_bytes)).convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=92)
            jpeg_bytes = buf.getvalue()

        # Determine page size from image dimensions
        img = Image.open(io.BytesIO(jpeg_bytes))
        img_w, img_h = img.size

        if c is None:
            c = pdf_canvas.Canvas(pdf_buf, pagesize=(img_w, img_h))
        else:
            c.setPageSize((img_w, img_h))

        img_reader = ImageReader(io.BytesIO(jpeg_bytes))
        c.drawImage(img_reader, 0, 0, width=img_w, height=img_h)
        c.showPage()
        
    if c is not None:
        c.save()

    pdf_buf.seek(0)
    return pdf_buf.getvalue()
