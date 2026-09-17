@echo off
echo [1/4] Killing old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3333') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7777') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5050') do taskkill /f /pid %%a 2>nul
echo [2/4] Starting Backend on Port 5050...
start cmd /k "cd ..\backend && node server.js"
if errorlevel 1 (
    echo Failed to start Backend. Please check the logs.
    exit /b 1
)
echo [3/4] Starting Frontend on Port 7777...
start cmd /k "cd ..\public && node server.js"
if errorlevel 1 (
    echo Failed to start Frontend. Please check the logs.
    exit /b 1
)
echo [4/4] Waiting for servers to start...
timeout /t 5
start http://localhost:7777
echo SOS Animal servers started successfully!
