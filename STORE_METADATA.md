# App Store & Play Console Metadata

---

## iOS App Store Connect

### App Information
- **App Name:** Territory Run
- **Subtitle:** GPS Territory Running Game
- **Bundle ID:** com.territoryrun.app
- **SKU:** territory-run-001
- **Primary Language:** English
- **Category:** Fitness (Primary), Games (Secondary)
- **Content Rights:** No third-party content

### Pricing & Availability
- **Price:** Free
- **Availability:** All territories
- **Release:** Manual release after approval

### App Privacy (Required)
- **Data Types Collected:** Location, Identifiers, User Content, Diagnostics
- **Tracking:** No
- **Third-Party Advertising:** No
- **Data Linked to User:** Yes (Location, Identifiers, User Content)
- **Data Not Linked:** Diagnostics

### Age Rating (Questionnaire Answers)
- **Cartoon/Fantasy Violence:** None
- **Realistic Violence:** None
- **Profanity:** None
- **Sexual Content:** None
- **Drug/Alcohol/Tobacco:** None
- **Gambling:** None
- **Horror/Fear:** None
- **Mature/Suggestive:** None
- **Medical/Treatment:** None (Health disclaimer in Terms)
- **User-Generated Content:** Yes (display names, territory boundaries)
- **Unrestricted Web Access:** No
- **Social Features:** Yes (leaderboards, territory contests)
- **Location Access:** Yes (precise, when-in-use + background optional)

**Result:** 4+ (No objectionable content)

### Version Information
- **Version:** 1.0.0
- **Build:** 1
- **What's New:** Initial release - GPS territory running game with real-time multiplayer, achievements, streaks, and leaderboards.

### Screenshots Required (6.5" iPhone)
1. Map screen with territory polygons
2. Run in progress (HUD)
3. Run summary with achievements
4. Leaderboard
5. Profile with stats
6. Settings

### App Preview Video (Optional)
- 15-30 seconds showing run start → trail → territory claim → summary

### Description
```
Turn your runs into a strategy game. Territory Run uses GPS to track your trail and lets you claim virtual territory by running loops in the real world.

🗺️ CLAIM TERRITORY
Run a closed loop to claim the area inside. The bigger the loop, the more territory you control. Strengthen your borders by running them again.

⚔️ CONTEST & DEFEND
See nearby players' territories in real-time. Run into their borders to contest them. Defend your own when rivals approach.

🏆 ACHIEVEMENTS & STREAKS
Unlock achievements for distance milestones, territory size, and daily streaks. Climb the global leaderboard.

🏃 PURE RUNNING
No GPS spoofing, no bots. Pure effort = pure territory. Works offline - syncs when you're back online.

⚡ FEATURES
• Real-time GPS tracking with offline support
• Background location for long runs
• Push notifications for territory contests
• Haptic feedback for run milestones
• Dark/light mode, custom territory colors
• Achievements: Century Club, Marathoner, Empire Builder
• Daily streaks with streak freeze protection
• Privacy-first: your data, your control
```

### Keywords
running,gps,fitness,territory,game,multiplayer,achievements,streaks,leaderboard,health

### Support URL
https://territoryrun.app/support

### Marketing URL
https://territoryrun.app

### Privacy Policy URL
https://territoryrun.app/privacy-policy.html

---

## Google Play Console

### App Details
- **App Name:** Territory Run
- **Short Description:** Turn runs into territory. GPS strategy game with real-time multiplayer.
- **Full Description:** (Same as iOS description)
- **App Icon:** 512x512 PNG (adaptive icon provided)
- **Feature Graphic:** 1024x500 PNG
- **Screenshots:** Phone (min 2, max 8), 7-inch Tablet (optional), 10-inch Tablet (optional)

### Categorization
- **Application Type:** App
- **Category:** Health & Fitness
- **Tags:** Running, GPS, Fitness, Game, Multiplayer

### Target Audience
- **Target Age:** 13+
- **Designed for Families:** No (fitness game with location)

### Content Rating (IARC)
- **Questionnaire:** Same as iOS
- **Rating:** Everyone (or Low Maturity)

### Data Safety (From ANDROID_DATA_SAFETY.md)
- **Data Collected:** Location, Personal Info, App Activity, App Info, Device IDs
- **Data Shared:** With other players (gameplay), Firebase/Google (infrastructure)
- **Security:** Encrypted in transit & at rest
- **Deletion:** User can request deletion

### Permissions
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Target API Level
- **Target SDK:** 34 (Android 14)
- **Min SDK:** 24 (Android 7.0)

### Release Track
- **Internal Testing** → **Closed Testing** → **Open Testing** → **Production**

### Release Notes (1.0.0)
```
Initial release of Territory Run!

🗺️ Claim territory by running loops
⚔️ Contest & defend against nearby players
🏆 Achievements, streaks & global leaderboard
📱 Works offline, syncs when online
🔔 Push notifications for territory contests
📊 Export your data anytime
🔒 Privacy-first: delete account anytime
```

### Pre-Launch Report
- Enable for API 24-34
- Test on: Pixel 7, Galaxy S23, Pixel Tablet

### Store Listing Experiments
- A/B test: Feature graphic variants
- A/B test: Short description variants

---

## Common Assets Needed

| Asset | iOS | Android | Specs |
|-------|-----|---------|-------|
| App Icon | ✅ | ✅ | 1024x1024 (iOS), 512x512 adaptive (Android) |
| Splash Screen | ✅ | ✅ | 2732x2732 (iOS), multiple densities (Android) |
| Screenshots | ✅ | ✅ | 6.5" (1290x2796), 5.5" (1242x2688) |
| Feature Graphic | ❌ | ✅ | 1024x500 |
| App Preview | ✅ | ✅ | 15-30s video |
| Privacy Policy | ✅ | ✅ | Hosted URL |

---

## Launch Checklist

### Pre-Submission
- [ ] Privacy Policy hosted at /privacy-policy.html
- [ ] Terms of Service hosted at /terms-of-service.html
- [ ] Support email configured (support@territoryrun.app)
- [ ] All screenshots captured on real devices
- [ ] TestFlight / Internal Testing passed
- [ ] Crash-free sessions > 99.5%
- [ ] No ANRs or crashes in pre-launch report
- [ ] Data Safety form completed (Play Console)
- [ ] App Privacy form completed (App Store Connect)
- [ ] Age rating questionnaire completed

### Post-Launch
- [ ] Monitor crash rates (Sentry)
- [ ] Monitor ANR rates (Play Console)
- [ ] Respond to reviews (both stores)
- [ ] Track conversion rates
- [ ] Plan 1.0.1 bug fix release