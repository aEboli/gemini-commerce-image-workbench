@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

if not exist ".runtime" mkdir ".runtime" >nul 2>nul

set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
if not exist "%NPM_CMD%" (
  echo npm.cmd not found: %NPM_CMD%
  echo Please install Node.js or adjust this script.
  pause
  exit /b 1
)

set "PORT="
for %%P in (3000 3001 3002 3003 3004 3005) do (
  call :TRY_PORT %%P
  if defined PORT goto :PORT_FOUND
)

echo No free port found in 3000-3005.
echo Run: netstat -ano ^| findstr LISTENING
pause
exit /b 1

:TRY_PORT
netstat -ano | findstr /R /C:":%1 .*LISTENING" >nul
if errorlevel 1 set "PORT=%1"
goto :eof

:PORT_FOUND
if not exist node_modules (
  echo Installing dependencies...
  call "%NPM_CMD%" install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Building app for production...
call "%NPM_CMD%" run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

set "LOGFILE=%~dp0.runtime\prod-%PORT%.log"
if exist "%LOGFILE%" del "%LOGFILE%" >nul 2>nul

echo Starting production server on port %PORT% ...
start "AI Image Studio Production" /min cmd /c ""%NPM_CMD%" start -- --hostname 127.0.0.1 --port %PORT% > "%LOGFILE%" 2>&1"

set "READY="
for /l %%I in (1,1,25) do (
  netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
  if not errorlevel 1 (
    set "READY=1"
    goto :READY
  )
  timeout /t 1 >nul
)

if not defined READY (
  echo Production server did not start successfully.
  echo Log file: %LOGFILE%
  if exist "%LOGFILE%" (
    echo ---------------- LOG START ----------------
    type "%LOGFILE%"
    echo ----------------- LOG END -----------------
  )
  pause
  exit /b 1
)

:READY
echo Server is ready.
echo URL: http://127.0.0.1:%PORT%
start "" http://127.0.0.1:%PORT%
echo Log file: %LOGFILE%
echo You can close this helper window now.
pause
exit /b 0
