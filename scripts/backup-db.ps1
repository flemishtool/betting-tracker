# =============================================
# Database Backup Script for Betting Tracker
# =============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Betting Tracker - Database Backup    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the project root (parent of scripts folder)
$projectRoot = Split-Path -Parent $PSScriptRoot
$dbPath = Join-Path $projectRoot "prisma\dev.db"
$backupFolder = Join-Path $projectRoot "backups"

# Check if database exists
if (!(Test-Path $dbPath)) {
    Write-Host "ERROR: Database not found at: $dbPath" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project folder." -ForegroundColor Yellow
    exit 1
}

# Create backups folder if it doesn't exist
if (!(Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder | Out-Null
    Write-Host "Created backups folder: $backupFolder" -ForegroundColor Green
}

# Create timestamp for filename
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFileName = "betting-tracker_$timestamp.db"
$backupPath = Join-Path $backupFolder $backupFileName

# Copy the database
try {
    Copy-Item $dbPath $backupPath -ErrorAction Stop
    
    # Get file sizes
    $originalSize = (Get-Item $dbPath).Length / 1KB
    $backupSize = (Get-Item $backupPath).Length / 1KB
    
    Write-Host ""
    Write-Host "SUCCESS! Database backed up." -ForegroundColor Green
    Write-Host ""
    Write-Host "Details:" -ForegroundColor White
    Write-Host "  - Original:  $dbPath" -ForegroundColor Gray
    Write-Host "  - Backup:    $backupPath" -ForegroundColor Gray
    Write-Host "  - Size:      $([math]::Round($backupSize, 2)) KB" -ForegroundColor Gray
    Write-Host ""
    
    # List recent backups
    $backups = Get-ChildItem $backupFolder -Filter "*.db" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
    Write-Host "Recent backups:" -ForegroundColor Cyan
    foreach ($backup in $backups) {
        $age = (Get-Date) - $backup.LastWriteTime
        $ageStr = if ($age.Days -gt 0) { "$($age.Days)d ago" } elseif ($age.Hours -gt 0) { "$($age.Hours)h ago" } else { "$($age.Minutes)m ago" }
        Write-Host "  - $($backup.Name) ($ageStr)" -ForegroundColor Gray
    }
    Write-Host ""
    
} catch {
    Write-Host "ERROR: Failed to create backup." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}