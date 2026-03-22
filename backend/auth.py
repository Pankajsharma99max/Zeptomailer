from fastapi import Header, HTTPException, status
from config import get_settings

settings = get_settings()

async def verify_password(x_api_key: str = Header(None, alias="x-api-key")):
    """
    Dependency to verify the APP_PASSWORD provided via the x-api-key header.
    If APP_PASSWORD is set in the environment, it enforces the check.
    If not set, it allows access without a password (useful for local dev or if disabled).
    """
    if not settings.APP_PASSWORD:
        return True # Password check disabled
    
    if not x_api_key or x_api_key != settings.APP_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing password",
        )
    return True
