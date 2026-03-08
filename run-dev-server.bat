@echo off
setlocal
cd /d "%~dp0"
set PORT=%~1
set LOGFILE=%~2
if "%PORT%"=="" exit /b 1
if "%LOGFILE%"=="" set LOGFILE=%~dp0.runtime\dev-%PORT%.log
call "C:\Program Files\nodejs\npm.cmd" run dev -- --hostname 127.0.0.1 --port %PORT% > "%LOGFILE%" 2>&1