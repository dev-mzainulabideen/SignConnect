# PowerShell script to get SHA-1 fingerprint for Android debug keystore
# Run this script and add the SHA-1 fingerprint to Firebase Console

Write-Host "Getting SHA-1 fingerprint for Android debug keystore..." -ForegroundColor Cyan

$keystorePath = "android\app\debug.keystore"
$keystorePassword = "android"
$keyAlias = "androiddebugkey"

if (-not (Test-Path $keystorePath)) {
    Write-Host "Error: Debug keystore not found at $keystorePath" -ForegroundColor Red
    Write-Host "Creating debug keystore..." -ForegroundColor Yellow
    
    # Create debug keystore if it doesn't exist
    $keytoolPath = "keytool"
    if (Get-Command keytool -ErrorAction SilentlyContinue) {
        & keytool -genkeypair -v -keystore $keystorePath -alias $keyAlias -keyalg RSA -keysize 2048 -validity 10000 -storepass $keystorePassword -keypass $keystorePassword -dname "CN=Android Debug,O=Android,C=US"
    } else {
        Write-Host "Error: keytool not found. Please install Java JDK." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "SHA-1 Fingerprint:" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

# Get SHA-1 fingerprint
$sha1Output = & keytool -list -v -keystore $keystorePath -alias $keyAlias -storepass $keystorePassword -keypass $keystorePassword 2>&1

if ($LASTEXITCODE -eq 0) {
    $sha1Match = $sha1Output | Select-String -Pattern "SHA1:\s+([A-F0-9:]+)"
    if ($sha1Match) {
        $sha1 = $sha1Match.Matches[0].Groups[1].Value
        Write-Host $sha1 -ForegroundColor Yellow
        Write-Host ""
        Write-Host "SHA-256 Fingerprint:" -ForegroundColor Green
        Write-Host "====================" -ForegroundColor Green
        
        $sha256Match = $sha1Output | Select-String -Pattern "SHA256:\s+([A-F0-9:]+)"
        if ($sha256Match) {
            $sha256 = $sha256Match.Matches[0].Groups[1].Value
            Write-Host $sha256 -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Instructions:" -ForegroundColor Cyan
        Write-Host "1. Copy the SHA-1 fingerprint above" -ForegroundColor White
        Write-Host "2. Go to Firebase Console > Project Settings > Your Android App" -ForegroundColor White
        Write-Host "3. Click 'Add fingerprint' and paste the SHA-1" -ForegroundColor White
        Write-Host "4. Download the updated google-services.json" -ForegroundColor White
        Write-Host "5. Replace android/app/google-services.json with the new file" -ForegroundColor White
    } else {
        Write-Host "Error: Could not extract SHA-1 fingerprint" -ForegroundColor Red
    }
} else {
    Write-Host "Error running keytool. Make sure Java JDK is installed." -ForegroundColor Red
    Write-Host $sha1Output -ForegroundColor Red
}

