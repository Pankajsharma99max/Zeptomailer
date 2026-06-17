from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    ZEPTOMAIL_TOKEN: str = ""
    SENDER_EMAIL: str = "noreply@yourdomain.com"
    SENDER_NAME: str = "Certificate Service"
    ADMIN_EMAIL: str = "admin@yourdomain.com"
    BATCH_SIZE: int = 100  # Increased from 50 for faster processing
    BATCH_DELAY_SECONDS: float = 0.5  # Reduced from 1.0 for lower latency
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    APP_PASSWORD: str = ""


    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
