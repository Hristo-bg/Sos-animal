@echo off
title RoadGuardian - Starting Application
echo ========================================
echo       RoadGuardian Animal Rescue
echo ========================================
echo.

echo [1/3] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3333') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7777') do taskkill /f /pid %%a >nul 2>&1

echo [2/3] Installing required dependencies...
cd /d "%~dp0..\backend"
if not exist node_modules (
    echo Installing dependencies...
    call npm.cmd install
)

cd /d "%~dp0..\desktop"
if not exist node_modules (
    echo Installing desktop app dependencies...
    call npm.cmd install
)

echo.
echo [3/3] Starting SOS Animal desktop app...
call npm.cmd start
