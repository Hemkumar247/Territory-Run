# Android Keystore Setup for Release Builds

## Option 1: Use Debug Keystore (Simplest for Beta Testing)

For alpha/beta testing with friends, you can use the debug keystore. The workflow will work without any additional setup - it will just use the default debug signing.

**Note:** Debug-signed APKs are not suitable for Play Store, but work fine for direct distribution to testers.

## Option 2: Generate Release Keystore (Recommended)

### 1. Generate Keystore
```bash
keytool -genkey -v \
  -keystore territory-run-release.keystore \
  -alias territory-run \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Territory Run, OU=Engineering, O=Territory Run, L=City, ST=State, C=US"
```

### 2. Convert to Base64 for GitHub Secrets
```bash
base64 -i territory-run-release.keystore -o keystore.base64
cat keystore.base64
```

### 3. Add GitHub Repository Secrets
Go to: `https://github.com/Hemkumar247/Territory-Run/settings/secrets/actions`

Add these secrets:
| Secret Name | Value |
|-------------|-------|
| `RELEASE_STORE_FILE_BASE64` | Output from `cat keystore.base64` |
| `RELEASE_STORE_PASSWORD` | Your keystore password |
| `RELEASE_KEY_ALIAS` | `territory-run` |
| `RELEASE_KEY_PASSWORD` | Your key password |

### 4. Store Keystore Securely
**IMPORTANT:** Save `territory-run-release.keystore` and passwords in a secure location (password manager, encrypted backup). **Losing this keystore means you cannot update the app on Play Store.**

## Option 3: Local Build (For Testing)

```bash
cd Territory-Run/android
./gradlew assembleRelease
# APK at: app/build/outputs/apk/release/app-release.apk
```

## Verifying APK Signature
```bash
# Check signing info
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk

# Check permissions
aapt dump permissions android/app/build/outputs/apk/release/app-release.apk
```

## GitHub Actions Workflow
The workflow at `.github/workflows/android-build.yml` will:
1. Build on every tag push (e.g., `git tag v1.0.0-beta.1 && git push origin v1.0.0-beta.1`)
2. Or manual trigger via Actions tab
3. Create GitHub Release with APK attached
4. Or upload as artifact for non-tag builds

## Sharing with Testers
1. Go to: `https://github.com/Hemkumar247/Territory-Run/releases`
2. Download `app-release.apk` from latest release
3. Share the release URL or APK file with testers
4. Testers enable "Install unknown apps" and install