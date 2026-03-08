@echo off
setlocal
cd /d "%~dp0"

echo Stopping local Node servers on ports 3000-3005...
for %%P in (3000 3001 3002 3003 3004 3005) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    echo Killing PID %%I on port %%P ...
    taskkill /PID %%I /F >nul 2>nul
  )
)

if exist .next\dev\lock (
  del /f /q .next\dev\lock >nul 2>nul
  echo Removed .next\dev\lock
)

echo Done.
pause