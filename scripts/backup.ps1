<#
.SYNOPSIS
    Backup and Restore utility for "Unchartered — Legends & Legacies" on Windows PowerShell.
.DESCRIPTION
    Creates a timestamped compressed archive containing the database (PostgreSQL / SQLite)
    and media uploads directory. Also supports full archive restoration.
.EXAMPLE
    .\scripts\backup.ps1 -Action backup
    .\scripts\backup.ps1 -Action restore -ArchivePath .\backups\unchartered_backup_20260301.zip
#>

param(
    [ValidateSet('backup', 'restore')]
    [string]$Action = 'backup',

    [string]$ArchivePath = '',
    [string]$BackupDir = '.\backups',
    [string]$DbContainer = 'unchartered_postgres',
    [string]$DbName = 'unchartered_db',
    [string]$DbUser = 'postgres',
    [string]$MediaDir = '.\media'
)

$ErrorActionPreference = 'Stop'
$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

function Invoke-Backup {
    Write-Host "==> Starting backup of Unchartered Podcast database and media..." -ForegroundColor Cyan
    $StageDir = Join-Path $BackupDir "unchartered_backup_$Timestamp"
    New-Item -ItemType Directory -Path $StageDir -Force | Out-Null

    # 1. Database backup
    Write-Host "--> Checking database connection..." -ForegroundColor Gray
    $dockerRunning = $false
    try {
        $dockerPs = docker ps --format '{{.Names}}' 2>$null
        if ($dockerPs -contains $DbContainer) {
            $dockerRunning = $true
        }
    } catch {}

    if ($dockerRunning) {
        Write-Host "--> Dumping PostgreSQL via Docker container: $DbContainer..." -ForegroundColor Green
        $dumpFile = Join-Path $StageDir "database_$Timestamp.dump"
        docker exec -t $DbContainer pg_dump -U $DbUser -d $DbName -F c | Set-Content -Path $dumpFile -AsByteStream
    } elseif (Test-Path ".\payload.db") {
        Write-Host "--> Copying local SQLite database payload.db..." -ForegroundColor Yellow
        Copy-Item -Path ".\payload.db" -Destination (Join-Path $StageDir "payload_$Timestamp.db")
    } else {
        Write-Host "--> Warning: No running Docker DB container or payload.db found." -ForegroundColor Yellow
    }

    # 2. Media Directory backup
    if (Test-Path $MediaDir) {
        Write-Host "--> Copying media uploads directory: $MediaDir..." -ForegroundColor Green
        Copy-Item -Path $MediaDir -Destination (Join-Path $StageDir "media") -Recurse -Force
    }

    # 3. Create compressed Zip Archive
    $FinalZip = Join-Path $BackupDir "unchartered_full_backup_$Timestamp.zip"
    Write-Host "--> Creating archive: $FinalZip..." -ForegroundColor Cyan
    Compress-Archive -Path "$StageDir\*" -DestinationPath $FinalZip -Force
    Remove-Item -Path $StageDir -Recurse -Force

    Write-Host "==> Backup completed successfully!" -ForegroundColor Green
    Write-Host "    Archive saved to: $FinalZip" -ForegroundColor Green
}

function Invoke-Restore {
    if (-not $ArchivePath -or -not (Test-Path $ArchivePath)) {
        Write-Error "Please specify a valid archive path using -ArchivePath <path_to_zip>"
        return
    }

    Write-Host "==> Restoring from archive: $ArchivePath..." -ForegroundColor Cyan
    $ExtractDir = Join-Path $BackupDir "restore_temp_$Timestamp"
    New-Item -ItemType Directory -Path $ExtractDir -Force | Out-Null

    Expand-Archive -Path $ArchivePath -DestinationPath $ExtractDir -Force

    # Restore SQLite if present
    $sqliteFile = Get-ChildItem -Path $ExtractDir -Filter "*payload*.db" | Select-Object -First 1
    if ($sqliteFile) {
        Write-Host "--> Restoring SQLite database: payload.db..." -ForegroundColor Green
        Copy-Item -Path $sqliteFile.FullName -Destination ".\payload.db" -Force
    }

    # Restore Media if present
    $mediaFolder = Join-Path $ExtractDir "media"
    if (Test-Path $mediaFolder) {
        Write-Host "--> Restoring media uploads folder..." -ForegroundColor Green
        if (-not (Test-Path $MediaDir)) {
            New-Item -ItemType Directory -Path $MediaDir -Force | Out-Null
        }
        Copy-Item -Path "$mediaFolder\*" -Destination $MediaDir -Recurse -Force
    }

    Remove-Item -Path $ExtractDir -Recurse -Force
    Write-Host "==> Restore completed successfully!" -ForegroundColor Green
}

if ($Action -eq 'backup') {
    Invoke-Backup
} elseif ($Action -eq 'restore') {
    Invoke-Restore
}
