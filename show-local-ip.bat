@echo off
echo IPv4 addresses:
ipconfig | findstr /i "IPv4"
pause