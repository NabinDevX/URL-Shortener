# Build Script for URL Shortener APK
# This script builds the Next.js web app and creates a signed APK for distribution

param(
    [switch]$SkipWeb = $false
)

$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = $scriptPath
$androidDir = Join-Path $scriptPath "android"
$outDir = Join-Path $scriptPath "out"
$apkOutDir = Join-Path $outDir "apk"

Write-Host "=== URL Shortener APK Build Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build Next.js web app
if (-not $SkipWeb) {
    Write-Host "📦 Building Next.js web app..." -ForegroundColor Yellow
    Push-Location $webDir
    pnpm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Web build failed" -ForegroundColor Red
        exit 1
    }
    Pop-Location
    Write-Host "✓ Web build completed" -ForegroundColor Green
} else {
    Write-Host "⊘ Skipping web build" -ForegroundColor Gray
}

# Step 2: Sync Capacitor
Write-Host "🔄 Syncing Capacitor..." -ForegroundColor Yellow
Push-Location $webDir
pnpm exec cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "✓ Capacitor synced" -ForegroundColor Green

# Step 3: Build Android APK
Write-Host "🔨 Building Android APK..." -ForegroundColor Yellow
Push-Location $androidDir
.\gradlew assembleRelease --no-daemon
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ APK build failed" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "✓ APK built successfully" -ForegroundColor Green

# Step 4: Copy signed APK to public directory
Write-Host "📂 Copying APK to public directory..." -ForegroundColor Yellow
$signedApk = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
New-Item -ItemType Directory -Path $apkOutDir -Force | Out-Null
Copy-Item -Path $signedApk -Destination "$apkOutDir\urltinier.apk" -Force
Write-Host "✓ APK copied to: $apkOutDir\urltinier.apk" -ForegroundColor Green

# Step 5: Display final info
$apkFile = Get-Item "$apkOutDir\urltinier.apk"
Write-Host ""
Write-Host "=== Build Complete ===" -ForegroundColor Green
Write-Host "APK File: $($apkFile.Name)"
Write-Host "Size: $('{0:N2}' -f ($apkFile.Length/1MB)) MB"
Write-Host "Path: $apkOutDir"
Write-Host ""
Write-Host "Download URL: /apk/urltinier.apk" -ForegroundColor Cyan
