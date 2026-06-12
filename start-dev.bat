@echo off
REM CertFlow — development mode (hot reload).
REM Backend on :8000, Vite dev server on :5173 (proxies /api and /ws).
start "CertFlow Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
start "CertFlow Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
pause
