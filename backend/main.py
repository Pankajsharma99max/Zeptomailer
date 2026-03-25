"""
Certificate-as-a-Service — FastAPI Application Entry Point.

In production (Render), serves the React frontend build from ./static.
In development, the frontend runs on its own Vite dev server.
"""

import os
import logging
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from config import get_settings
from auth import get_current_user, hash_password
from routers import upload, preview, campaign, progress, status, auth, settings as settings_router
from store import store
from database import db_cursor, get_connection
import uuid
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


# Configure logging for the entire app
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="Certificate-as-a-Service",
    description="High-performance certificate generation and email delivery platform",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# CORS — avoid wildcard in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN] if settings.FRONTEND_ORIGIN != "*" else ["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add various HTTP security headers for hardening."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # Basic CSP - allow self and some fonts
    # Note: In production, refine this to your specific needs
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:;"
    return response



# Include API routers
app.include_router(auth.router)
app.include_router(upload.router, dependencies=[Depends(get_current_user)])
app.include_router(preview.router, dependencies=[Depends(get_current_user)])
app.include_router(campaign.router, dependencies=[Depends(get_current_user)])
app.include_router(progress.router) # WebSocket auth handled inside the route
app.include_router(status.router, dependencies=[Depends(get_current_user)])
app.include_router(settings_router.router, dependencies=[Depends(get_current_user)])


@app.on_event("startup")
async def startup_event():
    """Load persisted data from disk on startup."""
    logger.info("Starting Certificate-as-a-Service...")
    store.load_from_disk()
    
    # Initialize default admin if no admin users exist
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
    row = cursor.fetchone()
    if row["count"] == 0:
        admin_username = settings.ADMIN_EMAIL
        admin_pw = settings.APP_PASSWORD or "admin123"
        hashed = hash_password(admin_pw)
        with db_cursor() as wcursor:
            wcursor.execute("INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)",
                            (str(uuid.uuid4()), admin_username, hashed, "admin"))
        logger.info(f"Created default admin user (username: {admin_username}, password: {'*' * len(admin_pw)})")
    conn.close()

    logger.info(
        "Startup complete. ZeptoMail=%s",
        bool(settings.ZEPTOMAIL_TOKEN),
    )


# -------------------------------------------------------------------
# Serve the React frontend build in production
# The Dockerfile copies frontend/dist → ./static
# -------------------------------------------------------------------
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.isdir(STATIC_DIR):
    # Serve static assets (JS, CSS, images) at /assets/...
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(STATIC_DIR, "assets")),
        name="static-assets",
    )

    # Serve other static files (favicon, vite.svg, etc.)
    @app.get("/vite.svg")
    async def vite_svg():
        return FileResponse(os.path.join(STATIC_DIR, "vite.svg"))

    # Catch-all: serve index.html for any non-API, non-WS route
    # This enables client-side routing (React Router, etc.)
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Don't intercept API or WebSocket routes
        if full_path.startswith("api/") or full_path.startswith("ws/") or full_path == "docs" or full_path == "openapi.json":
            return None
        index = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
        return {"detail": "Not found"}

    @app.get("/")
    async def root():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    # Dev mode — no static dir, just show API info
    @app.get("/")
    async def root():
        return {
            "service": "Certificate-as-a-Service",
            "status": "running",
            "docs": "/docs",
        }
