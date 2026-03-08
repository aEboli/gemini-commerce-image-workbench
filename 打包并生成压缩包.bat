@echo off
cd /d "%~dp0"
call "C:\Program Files\nodejs\npm.cmd" run build
if errorlevel 1 goto end
powershell -ExecutionPolicy Bypass -File ".\scripts\package-release.ps1" -SkipBuild -CreateZip
:end
pause
