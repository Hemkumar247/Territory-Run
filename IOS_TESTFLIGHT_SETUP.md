# iOS TestFlight Beta Testing Setup

## Overview
iOS beta distribution requires **Apple Developer Program ($99/year)** and **TestFlight**. There is no direct APK/IPA sharing like Android due to Apple's security model.

## Prerequisites
- [ ] Apple Developer Program enrollment ($99/year)
- [ ] Mac with Xcode 15+ (for building)
- [ ] Physical iOS device(s) for testing
- [ ] App Store Connect access

---

## Step 1: Configure Xcode Project

### 1. Open in Xcode
```bash
cd Territory-Run/ios/App
open App.xcworkspace
```

### 2. Configure Signing & Capabilities
1. Select `App` target → **Signing & Capabilities**
2. **Team:** Select your Apple Developer Team
3. **Bundle Identifier:** `com.territoryrun.app` (already set)
3. **Automatically manage signing:** ✅ Enabled

### 3. Add Required Capabilities
In **Signing & Capabilities**, add:
- `Background Modes` → ✅ `Location updates` + ✅ `Background fetch`
- `Push Notifications`
- `HealthKit` (optional - for fitness integration)
- `App Groups` (if sharing data with extensions)

### 4. Update Info.plist (Already configured via Capacitor)
Verify these keys exist in `App/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Territory Run needs your location to track runs and claim territory</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Background location tracking for continuous runs</string>
<key>NSMotionUsageDescription</key>
<string>Motion data for run tracking</string>
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
    <string>fetch</string>
</array>
```

---

## Step 2: Build & Archive

### 1. Select Destination
- **Any iOS Device (arm64)** for physical device
- **Generic iOS Device** for archive

### 2. Product → Archive
Wait for build to complete. Archives organizer opens automatically.

### 3. Validate & Distribute
1. Click **Distribute App**
2. Select **App Store Connect** → **Upload**
3. Wait for upload to complete
4. Click **Done**

---

## Step 3: App Store Connect Setup

### 1. Create App Record
1. Go to: https://appstoreconnect.apple.com
2. **My Apps** → **+** → **New App**
3. **Platform:** iOS
4. **Name:** Territory Run
5. **Primary Language:** English
6. **Bundle ID:** `com.territoryrun.app`
7. **SKU:** territory-run-001
8. **User Access:** Full Access

### 2. Configure TestFlight
1. Select your app → **TestFlight** tab
2. **Internal Testing:** Add up to 100 team members (need Apple IDs)
3. **External Testing:** Create group for friends (up to 10,000 testers)
   - Requires **Beta App Review** (1-2 days)
   - Add testers by email

### 3. App Privacy (Required)
1. **App Privacy** tab → **Edit**
2. **Data Types Collected:**
   - Location (Precise) - App Functionality
   - Identifiers (User ID) - App Functionality, Analytics
   - User Content - App Functionality
   - Diagnostics - Analytics
3. **Tracking:** No
4. **Third-Party Advertising:** No
5. **Save**

### 4. Age Rating
Complete questionnaire → **4+** (no objectionable content)

---

## Step 4: Invite Testers

### Internal Testers (Immediate)
1. **TestFlight** → **Internal Testing**
2. **+** → Add team members by Apple ID
3. They receive email invitation instantly

### External Testers (After Beta Review)
1. **TestFlight** → **External Testing** → **Create Group**
2. Name: "Friends & Family Beta"
3. Add testers by email
4. **Start Testing** → Submit for Beta App Review
5. Once approved (1-2 days), testers get invitation

---

## Step 5: TestFlight App Installation (Tester Side)

### On iPhone/iPad:
1. Open invitation email → **View in TestFlight**
2. Or open TestFlight app → **Redeem** → enter code
3. Tap **Install**
4. App appears on home screen with yellow TestFlight badge

### Updating Builds
1. Build new archive in Xcode → Upload to App Store Connect
2. **TestFlight** → Select build → **Start Testing**
3. Testers get push notification for update

---

## Alternative: Ad Hoc Distribution (Limited)

**For up to 100 devices/year without TestFlight:**

### 1. Get Device UDIDs
Testers: Settings → General → About → Tap Serial Number → Copy UDID

### 2. Register Devices
Apple Developer Portal → **Devices** → **+** → Add UDIDs

### 2. Create Ad Hoc Provisioning Profile
1. **Certificates, Identifiers & Profiles** → **Profiles** → **+**
2. **Ad Hoc** → Select App ID → Select Certificate → Select Devices
3. Download `.mobileprovision`

### 3. Build with Ad Hoc Profile
In Xcode: **Signing & Capabilities** → **Provisioning Profile** → Select Ad Hoc profile

### 4. Export IPA
**Product → Archive → Distribute App → Ad Hoc**

### 5. Distribute via Diawi/InstallOnAir
Upload IPA to https://diawi.com or https://installonair.com
Share link with testers

**Limitations:** 100 devices/year, expires annually, manual UDID collection

---

## Automated CI/CD (Optional)

### GitHub Actions for iOS
```yaml
# .github/workflows/ios-build.yml
name: Build iOS
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci --legacy-peer-deps && npm run build
        working-directory: ./Territory-Run
      - run: npx cap sync ios
        working-directory: ./Territory-Run
      - run: xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -archivePath build/App.xcarchive archive
        working-directory: ./Territory-Run
      - run: xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build -exportOptionsPlist ExportOptions.plist
        working-directory: ./Territory-Run
```

### Required: ExportOptions.plist
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
```

---

## Security Checklist for iOS

- [ ] **App Transport Security:** All HTTP → HTTPS (enforced by iOS)
- [ ] **Keychain:** Firebase Auth tokens stored securely
- [ ] **Biometric Auth:** Optional FaceID/TouchID for app lock (future)
- [ ] **App Groups:** Not used (no extensions)
- [ ] **Network Extensions:** Not used
- [ ] **Background Modes:** Only `location` + `fetch` (justified)
- [ ] **Privacy Manifest:** `PrivacyInfo.xcprivacy` included
- [ ] **Hardcoded Secrets:** None (API keys via env vars)

---

## Cost Summary
| Item | Cost |
|------|------|
| Apple Developer Program | $99/year |
| Mac (if needed) | $0 (if owned) |
| TestFlight | Free with Developer Program |

---

## Quick TestFlight Checklist
- [ ] Apple Developer Program active
- [ ] Xcode project opens and builds
- [ ] Archive uploads to App Store Connect
- [ ] App Privacy completed
- [ ] TestFlight group created
- [ ] Testers invited and can install
- [ ] Push notifications work (FCM → APNs)
- [ ] Background location works
- [ ] HealthKit works (if enabled)