# EMR Project Google Drive Backup & Automation Script
# Path: c:\Users\dbstj\OneDrive\바탕 화면\Anti gravity\EMR\backup_to_gdrive.ps1

$ErrorActionPreference = "Stop"

# 1. Path Configuration (Dynamic resolution to prevent encoding issues)
$workspace = $PSScriptRoot
$backupRoot = "W:\EMR_Backups"
$localBackupFallback = Join-Path (Split-Path -Parent $workspace) "EMR_Local_Backups"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " EMR Project Google Drive Backup System" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Workspace path: $workspace" -ForegroundColor Yellow

# 2. Verify target directory accessibility
$targetDir = $backupRoot
if (-not (Test-Path "W:\")) {
    Write-Host "[WARNING] Google Drive (W:\) is not accessible. Please check RaiDrive connection." -ForegroundColor Yellow
    Write-Host "Falling back to local backup directory: $localBackupFallback" -ForegroundColor Yellow
    $targetDir = $localBackupFallback
}

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "[INFO] Target backup directory created: $targetDir" -ForegroundColor Green
}

# 3. Create time-based ZIP archive name
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipName = "EMR_Backup_$timestamp.zip"
$finalZipPath = Join-Path $targetDir $zipName

Write-Host "[PROCESS] Gathering and compressing files to: $zipName..." -ForegroundColor Cyan

# 4. Pure PowerShell In-Process Zipper
Add-Type -Assembly 'System.IO.Compression'
Add-Type -Assembly 'System.IO.Compression.FileSystem'

$excludeDirs = @('.git', 'node_modules', 'dist', '.vercel', '.playwright-mcp', 'Backup')
$excludeFiles = @('.env.local', '.env', 'backup_to_gdrive.ps1', 'schedule_backup.ps1', 'run_backup.bat')

try {
    # Recursively get all files in workspace
    $files = Get-ChildItem -Path $workspace -Recurse -File
    Write-Host "Total files found by Get-ChildItem: $($files.Count)" -ForegroundColor Yellow
    
    # Open ZIP archive for writing
    $zip = [System.IO.Compression.ZipFile]::Open($finalZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
    $count = 0
    $skippedCount = 0
    
    foreach ($file in $files) {
        # Get path relative to the workspace root
        $relative = $file.FullName.Substring($workspace.Length + 1)
        
        # Check if any part of the file directory is in the exclusion list
        $parts = $relative.Split([System.IO.Path]::DirectorySeparatorChar)
        $shouldExclude = $false
        foreach ($part in $parts) {
            if ($excludeDirs -contains $part) {
                $shouldExclude = $true
                break
            }
        }
        
        if ($shouldExclude) {
            $skippedCount++
            continue
        }
        
        # Check if specific file is excluded
        if ($excludeFiles -contains $file.Name -or $file.Name.EndsWith(".zip") -or $file.Name.EndsWith(".tmp")) {
            $skippedCount++
            continue
        }
        
        # Create entry inside the ZIP
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relative, 'Optimal') | Out-Null
        $count++
    }
    
    # Close ZIP
    $zip.Dispose()
    Write-Host "[SUCCESS] Staged and compressed $count files successfully! (Skipped: $skippedCount)" -ForegroundColor Green
    Write-Host "[SUCCESS] Backup saved: $finalZipPath" -ForegroundColor Green
} catch {
    if ($zip) { $zip.Dispose() }
    if (Test-Path $finalZipPath) { Remove-Item $finalZipPath -Force }
    throw $_
}

# 5. Auto-cleanup old backups (Keep only the 5 most recent backups)
Write-Host "[PROCESS] Cleaning up old backups (Keeping last 5)..." -ForegroundColor Cyan
$oldBackups = Get-ChildItem -Path $targetDir -Filter "EMR_Backup_*.zip" | 
              Sort-Object CreationTime -Descending | 
              Select-Object -Skip 5

if ($oldBackups) {
    foreach ($file in $oldBackups) {
        Remove-Item $file.FullName -Force
        Write-Host "[CLEANUP] Deleted old backup: $($file.Name)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] No old backups to clean up." -ForegroundColor Gray
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host " EMR Backup Completed Successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
