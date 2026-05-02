#!/bin/bash
# Bash script to get SHA-1 fingerprint for Android debug keystore
# Run this script and add the SHA-1 fingerprint to Firebase Console

echo "Getting SHA-1 fingerprint for Android debug keystore..."

KEYSTORE_PATH="android/app/debug.keystore"
KEYSTORE_PASSWORD="android"
KEY_ALIAS="androiddebugkey"

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "Error: Debug keystore not found at $KEYSTORE_PATH"
    echo "Creating debug keystore..."
    
    keytool -genkeypair -v \
        -keystore "$KEYSTORE_PATH" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEYSTORE_PASSWORD" \
        -dname "CN=Android Debug,O=Android,C=US"
fi

echo ""
echo "SHA-1 Fingerprint:"
echo "=================="

keytool -list -v \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEYSTORE_PASSWORD" | \
    grep -A 1 "SHA1:" | \
    awk '/SHA1:/ {print $2}'

echo ""
echo "SHA-256 Fingerprint:"
echo "===================="

keytool -list -v \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEYSTORE_PASSWORD" | \
    grep -A 1 "SHA256:" | \
    awk '/SHA256:/ {print $2}'

echo ""
echo "Instructions:"
echo "1. Copy the SHA-1 fingerprint above"
echo "2. Go to Firebase Console > Project Settings > Your Android App"
echo "3. Click 'Add fingerprint' and paste the SHA-1"
echo "4. Download the updated google-services.json"
echo "5. Replace android/app/google-services.json with the new file"




