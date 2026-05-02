# PowerShell script to complete Google Sign-In setup
# This script helps verify and complete the Google Sign-In configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Sign-In Setup Completion Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify SHA-1 fingerprint
Write-Host "Step 1: Verifying SHA-1 Fingerprint..." -ForegroundColor Yellow
Write-Host ""

$keystorePath = "android\app\debug.keystore"
$keystorePassword = "android"
$keyAlias = "androiddebugkey"

if (-not (Test-Path $keystorePath)) {
    Write-Host "ERROR: Debug keystore not found!" -ForegroundColor Red
    Write-Host "Path: $keystorePath" -ForegroundColor Red
    exit 1
}

$sha1Output = & keytool -list -v -keystore $keystorePath -alias $keyAlias -storepass $keystorePassword -keypass $keystorePassword 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to read keystore!" -ForegroundColor Red
    Write-Host $sha1Output -ForegroundColor Red
    exit 1
}

$sha1Match = $sha1Output | Select-String -Pattern "SHA1:\s+([A-F0-9:]+)"
if ($sha1Match) {
    $currentSHA1 = $sha1Match.Matches[0].Groups[1].Value
    Write-Host "Current SHA-1 Fingerprint:" -ForegroundColor Green
    Write-Host $currentSHA1 -ForegroundColor Yellow
    Write-Host ""
    
    # Expected SHA-1
    $expectedSHA1 = "5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25"
    
    if ($currentSHA1 -eq $expectedSHA1) {
        Write-Host "✅ SHA-1 matches expected value!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SHA-1 does not match expected value." -ForegroundColor Yellow
        Write-Host "Expected: $expectedSHA1" -ForegroundColor Yellow
        Write-Host "Current:  $currentSHA1" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Could not extract SHA-1 fingerprint" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Firebase Console Checklist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please complete these steps in Firebase Console:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://console.firebase.google.com/" -ForegroundColor White
Write-Host "2. Select project: myfirstreactnativeapp-e1fbf" -ForegroundColor White
Write-Host "3. Click ⚙️ Settings → Project Settings" -ForegroundColor White
Write-Host "4. Scroll to 'Your apps' → Android app" -ForegroundColor White
Write-Host "5. Click 'Add fingerprint' button" -ForegroundColor White
Write-Host "6. Paste this SHA-1:" -ForegroundColor White
Write-Host "   $currentSHA1" -ForegroundColor Yellow
Write-Host "7. Click 'Save'" -ForegroundColor White
Write-Host "8. Click 'Download google-services.json'" -ForegroundColor White
Write-Host "9. Replace android/app/google-services.json with downloaded file" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter when you've completed these steps..." -ForegroundColor Cyan
$null = Read-Host

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Verifying google-services.json" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$googleServicesPath = "android\app\google-services.json"
if (Test-Path $googleServicesPath) {
    $googleServicesContent = Get-Content $googleServicesPath -Raw | ConvertFrom-Json
    
    # Check for Web Client ID
    $webClientId = $googleServicesContent.client[0].oauth_client | Where-Object { $_.client_type -eq 3 } | Select-Object -First 1
    if ($webClientId) {
        Write-Host "✅ Web Client ID found:" -ForegroundColor Green
        Write-Host "   $($webClientId.client_id)" -ForegroundColor Yellow
        
        if ($webClientId.client_id -eq "349652946238-ibohdpops1hjuohgja42dvurgbqal92u.apps.googleusercontent.com") {
            Write-Host "✅ Web Client ID matches expected value!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Web Client ID does not match expected value" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Web Client ID (client_type: 3) not found!" -ForegroundColor Yellow
    }
    
    # Check certificate hash
    $androidClient = $googleServicesContent.client[0].oauth_client | Where-Object { $_.client_type -eq 1 } | Select-Object -First 1
    if ($androidClient -and $androidClient.android_info) {
        $certHash = $androidClient.android_info.certificate_hash
        Write-Host ""
        Write-Host "Certificate Hash in google-services.json:" -ForegroundColor Cyan
        Write-Host "   $certHash" -ForegroundColor Yellow
        
        # Convert SHA-1 to hash format (remove colons, lowercase)
        $sha1Hash = $currentSHA1 -replace ":", "" | ForEach-Object { $_.ToLower() }
        
        if ($certHash -eq $sha1Hash) {
            Write-Host "✅ Certificate hash matches SHA-1 fingerprint!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Certificate hash does NOT match current SHA-1" -ForegroundColor Yellow
            Write-Host "   Expected: $sha1Hash" -ForegroundColor Yellow
            Write-Host "   Found:    $certHash" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   Make sure you:" -ForegroundColor Yellow
            Write-Host "   1. Added the SHA-1 to Firebase Console" -ForegroundColor Yellow
            Write-Host "   2. Downloaded the UPDATED google-services.json" -ForegroundColor Yellow
            Write-Host "   3. Replaced android/app/google-services.json" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "ERROR: google-services.json not found at $googleServicesPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Rebuild App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to rebuild the app? (Y/N)" -ForegroundColor Yellow
$rebuild = Read-Host

if ($rebuild -eq "Y" -or $rebuild -eq "y") {
    Write-Host ""
    Write-Host "Cleaning Android build..." -ForegroundColor Yellow
    Set-Location android
    & .\gradlew clean
    Set-Location ..
    
    Write-Host ""
    Write-Host "✅ Build cleaned!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run:" -ForegroundColor Cyan
    Write-Host "  npx react-native run-android" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then test Google Sign-In in your app!" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "To rebuild manually, run:" -ForegroundColor Cyan
    Write-Host "  cd android" -ForegroundColor Yellow
    Write-Host "  ./gradlew clean" -ForegroundColor Yellow
    Write-Host "  cd .." -ForegroundColor Yellow
    Write-Host "  npx react-native run-android" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

