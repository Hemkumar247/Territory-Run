# Android Data Safety Form - Territory Run

## Data Collection Summary

| Data Type | Collected? | Purpose | Shared? | Encrypted? | User Can Delete? |
|-----------|-----------|---------|---------|------------|------------------|
| **Location** | | | | | |
| Precise location (GPS) | ✅ Yes | App functionality - track runs, calculate territory | ✅ With other players (territory boundaries only) | ✅ In transit & at rest | ✅ Via account deletion |
| Approximate location | ❌ No | - | - | - | - |
| **Personal Info** | | | | | |
| Name | ✅ Yes | Account identification | ✅ With other players (display name only) | ✅ In transit & at rest | ✅ Via account deletion |
| Email address | ✅ Yes | Authentication, account recovery | ❌ No | ✅ In transit & at rest | ✅ Via account deletion |
| User ID | ✅ Yes | Account management | ✅ With other players (for game interactions) | ✅ In transit & at rest | ✅ Via account deletion |
| Profile photo | ✅ Yes | Profile display | ✅ With other players | ✅ In transit & at rest | ✅ Via account deletion |
| **App Activity** | | | | | |
| Run history | ✅ Yes | Game functionality | ✅ With other players (leaderboards) | ✅ In transit & at rest | ✅ Via account deletion |
| Achievements | ✅ Yes | Game functionality | ✅ With other players | ✅ In transit & at rest | ✅ Via account deletion |
| Streaks | ✅ Yes | Game functionality | ✅ With other players | ✅ In transit & at rest | ✅ Via account deletion |
| **App Info & Performance** | | | | | |
| Crash logs | ✅ Yes | App stability | ❌ No (Sentry) | ✅ In transit | ❌ Auto-deleted |
| Diagnostics | ✅ Yes | App performance | ❌ No | ✅ In transit | ❌ Auto-deleted |
| **Device or Other IDs** | | | | | |
| Device ID | ✅ Yes | Push notifications (FCM token) | ❌ No | ✅ In transit & at rest | ✅ Via account deletion |
| **Financial Info** | | | | | |
| Payment info | ❌ No | - | - | - | - |

---

## Data Collection Details

### Location Data (GPS)
- **Collected:** Latitude, longitude, accuracy, altitude, speed, heading, timestamp
- **When:** Only during explicitly started runs (user taps "Start Run")
- **Background:** While a run is active, collection continues with the screen off via a visible foreground-service notification (type "location"). No "Allow all the time" permission is requested; nothing is collected when no run is active and the app is closed.
- **Shared:** Territory boundaries (polygons) with nearby players, NOT raw GPS coordinates
- **Retention:** While account exists; deleted within 30 days of account deletion
- **User Control:** Can disable in device settings; delete via account deletion

### Personal Information
- **Email:** Used for authentication (Firebase Auth) and account recovery
- **Display Name:** Shown to other players on leaderboards and territory popups
- **Profile Photo:** From Google Sign-In or uploaded; shown on profile/territory
- **User ID:** Firebase UID; used for data association and game interactions

### Game Data
- **Run History:** Distance, duration, trail coordinates, territory area, timestamps
- **Territories:** Polygon coordinates, strength, area, last updated
- **Achievements:** Unlocked achievement IDs with timestamps
- **Streaks:** Current/longest consecutive run days
- **Leaderboard:** Aggregate stats (total distance, territory, runs)

### Analytics (Google Analytics 4)
- **Events:** run_started, run_completed, territory_claimed, achievement_unlocked, etc.
- **No PII:** Events contain only aggregated metrics (distance, area, counts)
- **Retention:** 14 months (GA4 default)

### Crash Reporting (Sentry)
- **Data:** Error stacks, device info, app version, breadcrumbs
- **No PII:** Session replay masks text and blocks media
- **Retention:** 90 days

---

## Data Sharing

| Recipient | Data Shared | Purpose |
|-----------|-------------|---------|
| Firebase (Google) | Auth data, Firestore data, FCM tokens | Backend infrastructure |
| Google Analytics | Anonymous event data | App analytics |
| Sentry | Error stacks, device info | Crash reporting |
| Other Players | Display name, territory polygons, aggregate stats | Gameplay |

---

## User Rights (GDPR/CCPA)

- **Access:** Export all data via "Export Data" in Delete Account flow
- **Rectification:** Edit profile in Settings
- **Deletion:** Delete Account in Settings (purges all data within 30 days)
- **Portability:** Export provides JSON with all user data
- **Restriction:** Disable location permissions in device settings
- **Objection:** Opt out of analytics in Settings

---

## Security

- **In Transit:** TLS 1.2+ for all network requests
- **At Rest:** Firebase encryption (AES-256)
- **Authentication:** Firebase Auth with secure token rotation
- **API Keys:** Restricted by domain/package name

---

## Third-Party SDKs

| SDK | Data Access | Purpose |
|-----|-------------|---------|
| Firebase Auth | Email, UID, auth tokens | Authentication |
| Firebase Firestore | All game data | Database |
| Firebase Cloud Messaging | FCM token | Push notifications |
| Google Analytics | Anonymous events | Analytics |
| Sentry | Error data, device info | Crash reporting |
| Capacitor Plugins | Location, device info, notifications | Native features |

---

## Compliance

- **COPPA:** Not directed to children under 13
- **GDPR:** Lawful basis = contract performance + legitimate interest
- **CCPA:** No sale of personal information
- **LGPD:** Compatible with Brazilian law

---

## Contact

**Data Protection Officer:** privacy@territoryrun.app
**Support:** support@territoryrun.app