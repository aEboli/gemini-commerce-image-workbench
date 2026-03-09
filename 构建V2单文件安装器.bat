@echo off
setlocal
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\scripts\build-inno-installer.ps1" -SkipBuild -SanitizeSecrets -ReleaseTag v2
pause
