@echo off
echo =========================================
echo       Starting CERTIFY HUB Server
echo =========================================
echo.
echo Starting Backend (FastAPI)...
start cmd /k "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend (Vite)...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo Once Vite is ready, you can access the site at:
echo http://localhost:5173/
echo.
pause
