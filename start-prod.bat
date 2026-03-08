@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  call "C:\Program Files\nodejs\npm.cmd" install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Building production app...
call "C:\Program Files\nodejs\npm.cmd" run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

echo Starting production server on http://127.0.0.1:3000
call "C:\Program Files\nodejs\npm.cmd" start -- --hostname 127.0.0.1 --port 3000
pause