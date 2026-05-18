# EMR Backup Scheduler Registration Script
# Path: c:\Users\dbstj\OneDrive\바탕 화면\Anti gravity\EMR\schedule_backup.ps1

$ErrorActionPreference = "Stop"

# Dynamically resolve script path to prevent any encoding/parsing issues
$scriptPath = Join-Path $PSScriptRoot "backup_to_gdrive.ps1"
$taskName = "EMR_Project_Daily_Backup"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " EMR Daily Backup Task Registration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

try {
    # 1. Remove existing task if it exists
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false | Out-Null
        Write-Host "[INFO] Removed existing backup task." -ForegroundColor Yellow
    }

    # 2. Define action
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

    # 3. Define trigger - Daily at 11:00 PM (23:00)
    $trigger = New-ScheduledTaskTrigger -Daily -At "23:00"

    # 4. Define settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

    # 5. Register task
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Daily Google Drive backup for the EMR project" | Out-Null

    Write-Host "[SUCCESS] Daily automated backup task registered successfully in Windows Scheduler!" -ForegroundColor Green
    Write-Host "Task Name: $taskName" -ForegroundColor Green
    Write-Host "This task will run silently in the background every day at 11:00 PM." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to register task with Windows Scheduler." -ForegroundColor Red
    Write-Host "Reason: Registering scheduled tasks requires Administrator privileges." -ForegroundColor Yellow
    Write-Host "Solution: Open PowerShell as Administrator and run:" -ForegroundColor Yellow
    Write-Host "powershell -ExecutionPolicy Bypass -File `"$scriptPath`"" -ForegroundColor Cyan
}
