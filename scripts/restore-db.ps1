# =============================================
# Database Restore Script for Betting Tracker
# =============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Betting Tracker - Database Restore   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the project root (parent of scripts folder)
$projectRoot = Split-Path -Parent $PSScriptRoot
$dbPath = Join-Path $projectRoot "prisma\dev.db"
$backupFolder = Join-Path $projectRoot "backups"

# Check if backups folder exists
if (!(Test-Path $backupFolder)) {
    Write-Host "ERROR: No backups folder found." -ForegroundColor Red
    Write-Host "Run backup-db.ps1 first to create a backup." -ForegroundColor Yellow
    exit 1
}

# List available backups
$backups = Get-ChildItem $backupFolder -Filter "*.db" | Sort-Object LastWriteTime -Descending

if ($backups.Count -eq 0) {
    Write-Host "ERROR: No backup files found in $backupFolder" -ForegroundColor Red
    exit 1
}

Write-Host "Available backups:" -ForegroundColor Cyan
Write-Host ""

for ($i = 0; $i -lt $backups.Count; $i++) {
    $backup = $backups[$i]
    $size = [math]::Round($backup.Length / 1KB, 2)
    $date = $backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "  [$i] $($backup.Name)" -ForegroundColor White
    Write-Host "      Size: $size KB | Created: $date" -ForegroundColor Gray
    Write-Host ""
}

# Ask user which backup to restore
Write-Host ""
$selection = Read-Host "Enter the number of the backup to restore (or 'q' to quit)"

if ($selection -eq 'q') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Validate selection
$index = [int]$selection
if ($index -lt 0 -or $index -ge $backups.Count) {
    Write-Host "ERROR: Invalid selection." -ForegroundColor Red
    exit 1
}

$selectedBackup = $backups[$index]
Write-Host ""
Write-Host "You selected: $($selectedBackup.Name)" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: This will OVERWRITE your current database!" -ForegroundColor Red
$confirm = Read-Host "Are you sure? Type 'yes' to confirm"

if ($confirm -ne 'yes') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Create a backup of current database before overwriting
$currentBackupName = "pre-restore_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').db"
$currentBackupPath = Join-Path $backupFolder $currentBackupName

try {
    # Backup current database
    if (Test-Path $dbPath) {
        Copy-Item $dbPath $currentBackupPath -ErrorAction Stop
        Write-Host "Current database backed up to: $currentBackupName" -ForegroundColor Green
    }
    
    # Restore selected backup
    Copy-Item $selectedBackup.FullName $dbPath -Force -ErrorAction Stop
    
    Write-Host ""
    Write-Host "SUCCESS! Database restored from: $($selectedBackup.Name)" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Restart your dev server (npm run dev) to see changes." -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host "ERROR: Failed to restore database." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}