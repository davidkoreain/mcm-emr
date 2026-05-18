@echo off
chcp 65001 > nul
echo ==========================================
echo  EMR Project Backup Trigger
echo ==========================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup_to_gdrive.ps1"
pause
