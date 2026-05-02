# Fix Metro Bundler 500 Error Script
# Run this script whenever you encounter Metro bundler errors

Write-Host "Fixing Metro Bundler issues..." -ForegroundColor Cyan

# Step 1: Stop all Node processes
Write-Host "`n[1/5] Stopping Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✓ Node processes stopped" -ForegroundColor Green

# Step 2: Clear Metro cache
Write-Host "`n[2/5] Clearing Metro cache..." -ForegroundColor Yellow
$metroCache = "$env:LOCALAPPDATA\Temp\metro-*"
$hasteCache = "$env:LOCALAPPDATA\Temp\haste-*"
$nodeCache = "node_modules\.cache"

if (Test-Path $metroCache) {
    Remove-Item $metroCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Metro cache cleared" -ForegroundColor Green
}

if (Test-Path $hasteCache) {
    Remove-Item $hasteCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Haste cache cleared" -ForegroundColor Green
}

if (Test-Path $nodeCache) {
    Remove-Item $nodeCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Node modules cache cleared" -ForegroundColor Green
}

# Step 3: Clear Watchman (if installed)
Write-Host "`n[3/5] Clearing Watchman cache..." -ForegroundColor Yellow
try {
    watchman watch-del-all 2>$null
    Write-Host "✓ Watchman cache cleared" -ForegroundColor Green
} catch {
    Write-Host "⚠ Watchman not installed (optional)" -ForegroundColor Yellow
}

# Step 4: Clear Android build cache
Write-Host "`n[4/5] Clearing Android build cache..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Android build cache cleared" -ForegroundColor Green
}
if (Test-Path "android\.gradle") {
    Remove-Item "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Android Gradle cache cleared" -ForegroundColor Green
}

# Step 5: Reinstall node modules (optional, uncomment if needed)
# Write-Host "`n[5/6] Reinstalling node modules..." -ForegroundColor Yellow
# Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
# npm install
# Write-Host "✓ Node modules reinstalled" -ForegroundColor Green

Write-Host "`n[5/5] Done! Starting Metro bundler..." -ForegroundColor Yellow
Write-Host "`nStarting Metro with reset cache..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop Metro when done testing" -ForegroundColor Yellow
Write-Host ""

# Start Metro with reset cache
npx react-native start --reset-cache


