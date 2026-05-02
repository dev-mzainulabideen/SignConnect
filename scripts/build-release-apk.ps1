# PowerShell script to build a release APK for Android
# This script will generate a signed release APK ready for distribution

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Android Release APK Builder" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if keystore exists
$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"

if (-not (Test-Path $keystorePath)) {
    Write-Host "ERROR: Release keystore not found at: $keystorePath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please generate a release keystore first by running:" -ForegroundColor Yellow
    Write-Host "  .\scripts\generate-release-keystore.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

if (-not (Test-Path $keystorePropsPath)) {
    Write-Host "WARNING: keystore.properties not found. Using debug keystore for release build." -ForegroundColor Yellow
    Write-Host "This is NOT recommended for production!" -ForegroundColor Yellow
    Write-Host ""
}

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
Set-Location android
if (Test-Path "app\build") {
    Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
}
Set-Location ..

# Bundle JavaScript
Write-Host ""
Write-Host "Bundling JavaScript..." -ForegroundColor Yellow
$bundleCommand = "npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res"
Invoke-Expression $bundleCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to bundle JavaScript" -ForegroundColor Red
    exit 1
}

# Build release APK
Write-Host ""
Write-Host "Building release APK..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Cyan
Write-Host ""

Set-Location android

# Check if gradlew exists
if (-not (Test-Path "gradlew.bat")) {
    Write-Host "ERROR: gradlew.bat not found in android directory" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Build the release APK
$buildCommand = ".\gradlew.bat assembleRelease"
Invoke-Expression $buildCommand

Set-Location ..

if ($LASTEXITCODE -eq 0) {
    $apkPath = "android\app\build\outputs\apk\release\app-release.apk"
    
    if (Test-Path $apkPath) {
        $apkInfo = Get-Item $apkPath
        $apkSizeMB = [math]::Round($apkInfo.Length / 1MB, 2)
        
        Write-Host ""
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Release APK Location:" -ForegroundColor Cyan
        Write-Host "  $apkPath" -ForegroundColor White
        Write-Host ""
        Write-Host "APK Size: $apkSizeMB MB" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "You can now install this APK on Android devices!" -ForegroundColor Green
        Write-Host ""
        Write-Host "To install via ADB:" -ForegroundColor Yellow
        Write-Host "  adb install $apkPath" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "ERROR: APK file not found at expected location: $apkPath" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Build failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}




