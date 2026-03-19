"""
Certificate-as-a-Service — FastAPI Application Entry Point.

In production (Render), serves the React frontend build from ./static.
In development, the frontend runs on its own Vite dev server.
"""

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from config import get_settings
from routers import upload, preview, campaign, progress

settings = get_settings()

app = FastAPI(
    title="Certificate-as-a-Service",
    description="High-performance certificate generation and email delivery platform",
    version="1.0.0",
)

# CORS — allow the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(upload.router)
app.include_router(preview.router)
app.include_router(campaign.router)
app.include_router(progress.router)

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
