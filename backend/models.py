from pydantic import BaseModel
from typing import Optional, Literal


class CampaignConfig(BaseModel):
    """Configuration for a certificate email campaign."""
    x_percent: float          # Name X position as % of image width
    y_percent: float          # Name Y position as % of image height
    font_size: int = 48       # Font size in pixels
    font_color: str = "#000000"
    text_align: Literal["left", "center", "right"] = "center"
    email_subject: str = "Your Certificate"
    email_body: str = "Please find your certificate attached."
    is_html: bool = False
    test_mode: bool = False
    start_index: int = 0      # Skip this many recipients


class ProgressUpdate(BaseModel):
    """Real-time progress data pushed via WebSocket."""
    total: int
    sent: int
    failed: int
    current_batch: int
    total_batches: int
    estimated_seconds_remaining: float
    status: str  # "running", "completed", "stopped", "error"
    current_name: str = ""


class PreviewRequest(BaseModel):
    """Request to generate preview certificates."""
    x_percent: float
    y_percent: float
    font_size: int = 48
    font_color: str = "#000000"
    text_align: str = "center"
    sample_count: int = 5


class Recipient(BaseModel):
    """A single recipient parsed from CSV."""
    name: str
    email: str

class CampaignHistoryRecord(BaseModel):
    """A record of a completed or stopped campaign."""
    id: str
    timestamp: str
    subject: str
    total_sent: int
    total_failed: int
    status: str
