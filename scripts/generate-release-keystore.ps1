# PowerShell script to generate a release keystore for Android app signing
# This keystore will be used to sign the release APK

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Android Release Keystore Generator" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$keystorePath = "android\app\release.keystore"
$keyAlias = "myfirstreactnativeapp-key"

# Check if keystore already exists
if (Test-Path $keystorePath) {
    Write-Host "WARNING: Release keystore already exists at: $keystorePath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "Keystore generation cancelled." -ForegroundColor Yellow
        exit
    }
}

Write-Host "Please provide the following information for your keystore:" -ForegroundColor Green
Write-Host ""

# Get keystore password
$keystorePassword = Read-Host "Enter keystore password (min 6 characters)" -AsSecureString
$keystorePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword))

if ($keystorePasswordPlain.Length -lt 6) {
    Write-Host "ERROR: Keystore password must be at least 6 characters!" -ForegroundColor Red
    exit 1
}

# Get key password
$keyPassword = Read-Host "Enter key password (min 6 characters, or press Enter to use same as keystore)" -AsSecureString
$keyPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))

if ($keyPasswordPlain.Length -eq 0) {
    $keyPasswordPlain = $keystorePasswordPlain
} elseif ($keyPasswordPlain.Length -lt 6) {
    Write-Host "ERROR: Key password must be at least 6 characters!" -ForegroundColor Red
    exit 1
}

# Get other details
$firstName = Read-Host "Enter your first name (or press Enter for 'MyFirstReactNativeApp')"
if ([string]::IsNullOrWhiteSpace($firstName)) {
    $firstName = "MyFirstReactNativeApp"
}

$lastName = Read-Host "Enter your last name (or press Enter for 'Developer')"
if ([string]::IsNullOrWhiteSpace($lastName)) {
    $lastName = "Developer"
}

$organization = Read-Host "Enter organization name (or press Enter for 'MyFirstReactNativeApp')"
if ([string]::IsNullOrWhiteSpace($organization)) {
    $organization = "MyFirstReactNativeApp"
}

$city = Read-Host "Enter city (or press Enter for 'Unknown')"
if ([string]::IsNullOrWhiteSpace($city)) {
    $city = "Unknown"
}

$state = Read-Host "Enter state/province (or press Enter for 'Unknown')"
if ([string]::IsNullOrWhiteSpace($state)) {
    $state = "Unknown"
}

$country = Read-Host "Enter country code (2 letters, e.g., US, PK) (or press Enter for 'US')"
if ([string]::IsNullOrWhiteSpace($country)) {
    $country = "US"
}

Write-Host ""
Write-Host "Generating keystore..." -ForegroundColor Yellow

# Create the keystore using keytool
$dname = "CN=$firstName $lastName, OU=$organization, O=$organization, L=$city, ST=$state, C=$country"

$keytoolPath = "$env:JAVA_HOME\bin\keytool.exe"
if (-not (Test-Path $keytoolPath)) {
    # Try to find keytool in common locations
    $possiblePaths = @(
        "${env:ProgramFiles}\Java\*\bin\keytool.exe",
        "${env:ProgramFiles(x86)}\Java\*\bin\keytool.exe",
        "$env:LOCALAPPDATA\Android\Sdk\jbr\bin\keytool.exe"
    )
    
    $found = $false
    foreach ($path in $possiblePaths) {
        $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
        if ($resolved) {
            $keytoolPath = $resolved[0].Path
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "ERROR: keytool not found. Please ensure JAVA_HOME is set or Java is installed." -ForegroundColor Red
        Write-Host "You can also manually run:" -ForegroundColor Yellow
        Write-Host "keytool -genkeypair -v -storetype PKCS12 -keystore android\app\release.keystore -alias $keyAlias -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor Cyan
        exit 1
    }
}

# Generate keystore
$keytoolArgs = @(
    "-genkeypair",
    "-v",
    "-storetype", "PKCS12",
    "-keystore", $keystorePath,
    "-alias", $keyAlias,
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", "10000",
    "-storepass", $keystorePasswordPlain,
    "-keypass", $keyPasswordPlain,
    "-dname", $dname
)

try {
    & $keytoolPath $keytoolArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: Keystore generated successfully!" -ForegroundColor Green
        Write-Host "Location: $keystorePath" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "IMPORTANT: Keep this keystore file and passwords safe!" -ForegroundColor Yellow
        Write-Host "You will need them to update your app in the future." -ForegroundColor Yellow
        Write-Host ""
        
        # Create keystore.properties file
        $propsPath = "android\keystore.properties"
        $propsContent = @"
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=$keyAlias
MYAPP_RELEASE_STORE_PASSWORD=$keystorePasswordPlain
MYAPP_RELEASE_KEY_PASSWORD=$keyPasswordPlain
"@
        
        Set-Content -Path $propsPath -Value $propsContent -NoNewline
        Write-Host "Created keystore.properties file at: $propsPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. The keystore.properties file has been created with your credentials" -ForegroundColor White
        Write-Host "2. Update android/app/build.gradle to use the release keystore" -ForegroundColor White
        Write-Host "3. Build your release APK using: cd android && .\gradlew assembleRelease" -ForegroundColor White
        
    } else {
        Write-Host "ERROR: Failed to generate keystore. Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to generate keystore: $_" -ForegroundColor Red
    exit 1
}

