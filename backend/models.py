from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime


class CampaignConfig(BaseModel):
    """Configuration for a certificate email campaign."""
    x_percent: float          # Name X position as % of image width
    y_percent: float          # Name Y position as % of image height
    font_size: int = 48       # Font size in pixels
    font_color: str = "#000000"
    is_bold: bool = False
    font_family: str = "Roboto"
    text_align: Literal["left", "center", "right"] = "center"
    email_subject: str = "Your Certificate"
    email_body: str = "Please find your certificate attached."
    is_html: bool = False
    test_mode: bool = False
    start_index: int = 0      # Skip this many recipients
    email_only: bool = False  # Skip PDF generation and send plain/html email
    placeholder_pages: List[bool] = [] # Pages that should have the placeholder


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
    is_bold: bool = False
    font_family: str = "Roboto"
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

class User(BaseModel):
    id: str
    username: str
    role: Literal["admin", "worker"]

class UserCreate(BaseModel):
    username: str
    password: str
    role: Literal["admin", "worker"] = "worker"

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class CampaignMetadata(BaseModel):
    id: str
    creator_id: str
    status: Literal["pending", "approved", "running", "completed", "error", "stopped", "rejected"]
    config: CampaignConfig
    created_at: float
    total_count: int
    last_sent_count: int
    successful_count: int = 0
    failed_count: int = 0

class AppSettings(BaseModel):
    sender_name: str

class SettingsUpdate(BaseModel):
    sender_name: str
