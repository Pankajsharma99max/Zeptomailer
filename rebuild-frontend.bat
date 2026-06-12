@echo off
REM Rebuild the React frontend and copy it into backend\static
REM so the backend serves the latest UI.
cd /d "%~dp0frontend"
call npm run build
if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
)
if exist "..\backend\static" rmdir /s /q "..\backend\static"
xcopy /e /i /y dist "..\backend\static" >nul
echo Frontend build copied to backend\static.
pause
