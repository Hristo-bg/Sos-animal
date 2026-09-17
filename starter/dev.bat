@echo off
title SOS Animal - Dev Stack
echo ========================================
echo   SOS Animal - Developer Startup
echo ========================================
echo.

cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found on PATH. Install it from https://nodejs.org and try again.
    pause
    exit /b 1
)

echo [1/3] Freeing ports 3333, 5173, 7777 if still in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3333') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7777') do taskkill /f /pid %%a >nul 2>&1

echo [2/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies for the first time - this can take a minute...
    call npm.cmd run install:all
    if errorlevel 1 (
        echo Dependency install failed. See the output above.
        pause
        exit /b 1
    )
) else if not exist "backend\node_modules" (
    call npm.cmd run install:all
) else if not exist "admin\node_modules" (
    call npm.cmd run install:all
)

echo [3/3] Starting backend (3333), admin desk (5173), public site (7777)...
echo.
echo Admin desk:  http://localhost:5173
echo Public site: http://localhost:7777
echo API:         http://localhost:3333/api
echo.
echo Press Ctrl+C to stop all three.
echo.
call npm.cmd run dev
pause
