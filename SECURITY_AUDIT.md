# Security Audit - Territory Run

## Overview
This document outlines the security posture of Territory Run for beta testing and production release.

---

## Network Security

### HTTPS Enforcement
| Platform | Status | Details |
|----------|--------|---------|
| **Web (Vercel)** | ✅ Enforced | Automatic HTTPS via Vercel, HSTS headers |
| **Android** | ✅ Enforced | `android:usesCleartextTraffic="false"` (default API 28+) |
| **iOS** | ✅ Enforced | ATS (App Transport Security) blocks HTTP |

### Certificate Pinning
| Service | Status | Notes |
|---------|--------|-------|
| Firebase | ✅ Automatic | Firebase SDKs pin Google certs |
| Map Tiles (OSM) | ⚠️ Not pinned | Public tiles, low risk |
| Analytics (GA4) | ✅ Automatic | Google SDK pins |

### API Key Protection
| Key | Storage | Rotation |
|-----|---------|----------|
| Firebase Config | Client-side (public) | Firebase Console |
| Gemini API | **Server-side only** (Cloud Function) | Manual |
| Sentry DSN | Client-side (public) | Sentry Dashboard |
| GA4 Measurement ID | Client-side (public) | GA4 Admin |

**Critical:** Gemini API key is **never exposed to client** - all calls proxied through `/api/tactician` Cloud Function.

---

## Authentication & Authorization

### Firebase Authentication
| Feature | Implementation |
|---------|----------------|
| Email/Password | ✅ Firebase Auth (scrypt + salt) |
| Google Sign-In | ✅ OAuth 2.0 / OpenID Connect |
| Token Rotation | ✅ Automatic (1hr access, refresh tokens) |
| Session Management | ✅ Secure HTTP-only cookies (web) |
| Account Deletion | ✅ User-initiated + re-auth required |

### Authorization Rules (Firestore)
```javascript
// Users: Owner-only read/write
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Territories: Owner write, all authenticated read
match /territories/{territoryId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == resource.data.uid;
}

// Sessions: Owner write once, owner read
match /sessions/{sessionId} {
  allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
  allow read: if request.auth != null && request.auth.uid == resource.data.uid;
  allow update, delete: if false;
}

// Notifications: Owner-only
match /users/{userId}/notifications/{notificationId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Security Rules Validation
- ✅ Field-level validation (types, ranges, required fields)
- ✅ Immutable fields (UID, createdAt)
- ✅ Array size limits (friends ≤ 1000, coordinates ≤ 5000)
- ✅ Subcollection isolation (notifications per user)

---

## Data Encryption

### In Transit
| Path | Protocol | Cipher |
|------|----------|--------|
| Client ↔ Firebase | TLS 1.3 | AES-256-GCM |
| Client ↔ Vercel | TLS 1.3 | AES-256-GCM |
| Client ↔ Map Tiles | TLS 1.2+ | AES-256-GCM |
| Firebase ↔ Cloud Functions | TLS 1.3 | AES-256-GCM |

### At Rest
| Storage | Encryption | Key Management |
|---------|------------|----------------|
| Firestore | AES-256 | Google-managed (default) |
| Firebase Auth | AES-256 + scrypt | Google-managed |
| Cloud Functions | AES-256 | Google-managed |
| Android Keystore | AES-256 | Hardware-backed (API 23+) |
| iOS Keychain | AES-256 | Secure Enclave |

---

## Platform-Specific Security

### Android
| Feature | Implementation |
|---------|----------------|
| Network Security Config | `android:usesCleartextTraffic="false"` |
| Certificate Pinning | Firebase SDK automatic |
| Keystore | Hardware-backed (API 23+) |
| Biometric Auth | Not implemented (future) |
| SafetyNet/Play Integrity | Not implemented (future) |
| Permissions | Minimal, runtime requests |
| Data Backup | Disabled for sensitive data |

### iOS
| Feature | Implementation |
|---------|----------------|
| ATS (App Transport Security) | Enforced (no exceptions) |
| Keychain | Secure Enclave for tokens |
| App Transport Security | No exceptions |
| Privacy Manifest | `PrivacyInfo.xcprivacy` included |
| App Groups | Not used |
| Network Extensions | Not used |
| Background Modes | Justified (`location`, `fetch`) |

---

## Client-Side Security

### Content Security Policy (Vercel)
```nginx
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://tile.openstreetmap.org https://*.sentry.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Security Headers
| Header | Value |
|--------|-------|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | geolocation=(), microphone=(), camera=() |

### Input Validation
| Vector | Mitigation |
|--------|------------|
| XSS | React auto-escaping, CSP, sanitize user content |
| Injection | Firebase Security Rules, no raw SQL |
| CSRF | SameSite cookies, Firebase Auth tokens |
| Clickjacking | X-Frame-Options: DENY |

---

## Third-Party Dependencies

### Audited Packages (Production)
| Package | Version | Risk | Notes |
|---------|---------|------|-------|
| firebase | 12.11.0 | Low | Google-maintained |
| @capacitor/* | 8.x | Low | Official Capacitor |
| leaflet | 1.9.4 | Low | Mature, widely used |
| @turf/turf | 7.3.4 | Low | Geo calculations only |
| sentry | 11.12.0 | Low | Official SDK |
| react-leaflet | 5.0.0 | Low | Wrapper only |

### Dev Dependencies (Not in Production)
- @testing-library/* - Test only
- vitest - Test only
- eslint - Build only
- typescript - Build only

---

## Incident Response

### Breach Detection
| Signal | Tool | Response |
|--------|------|----------|
| Auth anomalies | Firebase Auth logs | Auto-lock + alert |
| Data exfiltration | Firestore audit logs | Revoke tokens + investigate |
| Crash spikes | Sentry alerts | Auto-rollback + debug |
| API abuse | Cloud Functions logs | Rate limit + block |

### Data Breach Procedure
1. **Detect** → Sentry/Firebase alerts
2. **Contain** → Revoke compromised tokens, disable API keys
3. **Assess** → Determine scope (users, data types)
4. **Notify** → Users within 72hrs (GDPR), authorities
4. **Remediate** → Patch, rotate keys, deploy fix
5. **Document** → Post-incident report

---

## Compliance

### GDPR (EU)
| Requirement | Status |
|-------------|--------|
| Lawful basis | Contract performance + consent |
| Data minimization | ✅ Only necessary data |
| Right to access | ✅ Export feature |
| Right to deletion | ✅ Delete Account flow |
| Right to portability | ✅ JSON export |
| DPIA | Not required (no high-risk processing) |
| DPO | Not required (< 250 employees) |

### CCPA (California)
| Requirement | Status |
|-------------|--------|
| No sale of data | ✅ Verified |
| Opt-out | ✅ Delete Account |
| Access request | ✅ Export feature |
| Deletion request | ✅ Delete Account |
| Minor consent | Not applicable (13+) |

### COPPA (Children)
| Requirement | Status |
|-------------|--------|
| Age gate | 13+ in Terms |
| Parental consent | Not collected |
| Data minimization | ✅ |

---

## Beta Testing Security Checklist

### Pre-Distribution
- [ ] Release keystore generated and stored securely
- [ ] GitHub secrets configured (if using release signing)
- [ ] Firebase App Check enabled (reCAPTCHA v3 / DeviceCheck)
- [ ] Sentry DSN configured for error tracking
- [ ] Analytics anonymized (no PII in events)
- [ ] Privacy Policy & Terms URLs accessible

### Distribution
- [ ] Android: GitHub Release with APK
- [ ] iOS: TestFlight invitation sent
- [ ] Testers briefed on "Install unknown apps" (Android)
- [ ] Testers have TestFlight app (iOS)

### Monitoring
- [ ] Sentry alerts configured for crash rate > 1%
- [ ] Firebase Analytics monitoring daily active users
- [ ] Firestore usage within free tier limits
- [ ] Cloud Function invocations monitored

---

## Security Contacts
| Role | Contact |
|------|---------|
| Security Issues | security@territoryrun.app |
| Data Protection | privacy@territoryrun.app |
| General Support | support@territoryrun.app |

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-beta.1 | 2024-11-14 | Initial security audit |