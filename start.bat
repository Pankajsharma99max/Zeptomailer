@echo off
REM CertFlow — one-click local start (production mode).
REM Serves the built frontend and the API together on http://localhost:8000
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
    echo Python venv not found at backend\.venv — create it and install requirements.txt first.
    pause
    exit /b 1
)
if not exist "static\index.html" (
    echo Frontend build missing — run rebuild-frontend.bat first.
    pause
    exit /b 1
)
start "" http://localhost:8000
.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
