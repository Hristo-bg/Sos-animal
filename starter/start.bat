@echo off
title RoadGuardian - Starting Application
echo ========================================
echo       RoadGuardian Animal Rescue
echo ========================================
echo.

echo [1/2] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3333') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7777') do taskkill /f /pid %%a >nul 2>&1

echo [2/2] Starting Backend Server...
cd /d "%~dp0..\backend"
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
echo Backend starting on port 3333...
start "Backend Server" cmd /c "node server.js"

echo.
echo Starting Frontend Server...
cd /d "%~dp0..\public"
echo Starting Node.js server on port 7777...
start "Frontend Server" cmd /c "node server.js"

echo.
echo ========================================
echo  Application Starting...
echo ========================================
echo Backend: http://localhost:3333
echo Frontend: http://localhost:7777
echo Dashboard: http://localhost:7777/dashboard.html
echo.
echo Waiting 5 seconds for servers to start...
timeout /t 5 /nobreak >nul

echo Opening browser...
start http://localhost:7777

echo.
echo ========================================
echo  Servers are running in separate windows
echo  Close this window to stop everything
echo ========================================
pause
