# PWA/Web App Access to Apple Health Step Data -- Deep Research Report

**Date:** 2026-03-30
**Confidence level:** HIGH (core findings) / MEDIUM (pricing -- may have changed)
**Goal:** Find the simplest "one button connect" path for step data from Apple Health to a PWA

---

## EXECUTIVE SUMMARY

1. **There is NO web/browser API for Apple HealthKit.** Apple has never exposed HealthKit to Safari, PWAs, or any JavaScript context. Not in iOS 17, 18, or 19. This is by design -- health data stays on-device.
2. **Apple Shortcuts with iCloud link is the simplest zero-cost path** (your current approach). It can be improved to near-one-tap with a pre-built iCloud shortcut link + token embedded in the shortcut URL.
3. **Third-party services (Terra, Sahha) require a native SDK** -- they cannot do web-only OAuth for Apple Health. They solve the "build an app" path, not the "PWA-only" path.
4. **Strava/Google Fit OAuth is the only true "browser-only, zero-install" option** -- but requires the user to already be syncing Health data to those services.
5. **Capacitor + HealthKit plugin works but requires TestFlight or App Store** -- it is a native app wrapper, not a PWA.

---

## OPTION 1: Apple HealthKit Web API

### Status: DOES NOT EXIST

**Confidence: HIGH**

Apple HealthKit is a native-only framework (Swift/Objective-C). There is no JavaScript, WebKit, or REST API for HealthKit. Key facts:

- HealthKit requires the `com.apple.developer.healthkit` entitlement, which is only available to native iOS/watchOS apps
- Data is stored in an encrypted SQLite database on-device, never synced to iCloud (except specific types like Medical ID)
- Apple has made zero announcements about web access through iOS 17 (2023), iOS 18 (2024), or iOS 19 (2025 WWDC)
- The Apple Developer docs at developer.apple.com/documentation/healthkit list only Swift/ObjC APIs
- There is no "Apple Health Connect" OAuth service analogous to Google's Health Connect REST API

**iOS 18/19 new features related to Health:**
- iOS 18 added pregnancy tracking, State of Mind API improvements
- iOS 19 (announced WWDC 2025) -- no web HealthKit API was announced. Focus was on expanded HealthKit data types for watchOS and visionOS
- Apple's privacy stance makes a web API extremely unlikely in the foreseeable future

**One-button score:** IMPOSSIBLE
**App Store required:** N/A
**Cost:** N/A
**Documentation:** https://developer.apple.com/documentation/healthkit

---

## OPTION 2: Apple Shortcuts (CURRENT APPROACH -- IMPROVABLE)

### Status: BEST OPTION for PWA

**Confidence: HIGH**

### How It Works Today (Current axs-tracker Implementation)

The project already has a Shortcuts-based flow:
1. User taps "Connect Apple Health" in Settings
2. Backend generates a short token (`axs-XXXXXXXX`) and a setup URL
3. User visits `/shortcuts/setup?token=...`
4. User must: copy the token, tap "Add to Shortcuts" (iCloud link), then paste the token into the shortcut on first run

**Current problem:** The iCloud shortcut URL is still `PLACEHOLDER`, and the flow requires manual token copy-paste (3 steps).

### How to Make It Near-One-Tap

The key insight: **iCloud shortcut links open the Shortcuts app directly and show "Add Shortcut" with one tap.** The shortcut itself can contain the full API endpoint URL. The only question is how to embed the per-user token.

**Approach A: Token baked into the shortcut URL (RECOMMENDED)**

Instead of sharing one generic iCloud shortcut, you can:

1. Create the shortcut on your iPhone with the token as a Text action at the top
2. Share it to iCloud -- each share generates a unique `https://www.icloud.com/shortcuts/<UUID>` URL
3. BUT -- this requires creating a separate iCloud link per user, which is not scalable via API

**Approach B: Token passed via clipboard (CURRENT -- can be improved)**

1. Web page auto-copies token to clipboard when user taps "Connect"
2. User taps "Add to Shortcuts" iCloud link
3. Shortcut uses "Get Clipboard" action to read the token on first run, then saves it to a file or Shortcut variable

This reduces it to: tap "Connect" -> tap "Add Shortcut" -> tap "Done". The token is invisible to the user.

**Approach C: Token passed via URL scheme (BEST)**

Apple Shortcuts supports `shortcuts://run-shortcut?name=...&input=...` but this requires the shortcut to already be installed. However, you can combine:

1. User taps one button on web page
2. This opens the iCloud shortcut link (shortcut installs with one tap)
3. The shortcut, on first run, calls `Get Contents of URL` to `https://yourapp.com/api/health/register?device_id=<UUID>` -- the shortcut generates its own unique device ID and your server creates the association
4. OR: The shortcut opens `https://yourapp.com/shortcuts/activate?shortcut_id=<random>` in Safari, which your web app detects and links to the logged-in session

**Approach D: Shortcut reads token from your web app URL (SIMPLEST)**

The shortcut flow:
1. Shortcut contains a hardcoded "Get Contents of URL" pointing to `https://yourapp.com/api/shortcuts/token`
2. This endpoint checks... wait, the shortcut has no auth context.

**RECOMMENDED APPROACH: Clipboard-based, zero-paste**

```
User flow (2 taps total):
1. User taps "Connect Apple Health" in your PWA
   -> Page auto-copies token to clipboard
   -> Page immediately redirects to iCloud shortcut link
2. Shortcuts app opens, shows "Add Shortcut" -> user taps "Add Shortcut"
3. Done. Shortcut runs daily via Automation.
   On first run, shortcut reads clipboard -> saves token.
```

The shortcut itself should:
1. `Get Clipboard` (first run) or read from saved file
2. `Find Health Samples` where Type is "Steps", Start Date is "Today"
3. `Get Contents of URL` (POST to your API with the token + step count)

### Shortcut iCloud Link Mechanics

- You create the shortcut on your device, share it via iCloud
- You get a URL like `https://www.icloud.com/shortcuts/abc123def456`
- When a user opens this URL on iPhone, Shortcuts app opens with "Add Shortcut" preview
- User taps one button to install
- The shortcut is pre-configured with all your actions -- the user does not need to edit anything
- Since iOS 15, Apple requires users to enable "Allow Untrusted Shortcuts" in Settings (or have run a shortcut before). Since iOS 16+, this restriction was relaxed for iCloud-shared shortcuts.

### Automation Setup (the remaining friction point)

After installing the shortcut, user needs to set up a Personal Automation:
- Open Shortcuts -> Automation -> "+" -> "Time of Day" -> 11 PM -> "Run Immediately"
- Select the installed shortcut
- This is 5-6 taps but only done once

**Alternative:** Include instructions or a deep link. Unfortunately, there is no URL scheme to create an Automation. The user must do this manually.

**One-button score:** 2 taps to install + 5-6 taps for automation = ~8 taps total (one-time setup)
**App Store required:** NO
**Cost:** FREE
**Maturity:** HIGH -- Apple Shortcuts is a mature, stable platform (since iOS 12/2018)
**Documentation:**
- https://support.apple.com/guide/shortcuts/
- https://support.apple.com/guide/shortcuts/share-shortcuts-apdf01f8c054/ios

---

## OPTION 3: Capacitor/PWA Bridge with HealthKit Plugin

### Status: WORKS but requires native distribution

**Confidence: HIGH**

### What Is Capacitor

Capacitor (by Ionic) wraps a web app in a native iOS/Android shell. Your existing Next.js PWA would run inside a WKWebView with access to native plugins including HealthKit.

### HealthKit Plugins Available

- `@perfood/capacitor-healthkit` -- most actively maintained, supports Capacitor 5+
- `capacitor-healthkit` -- original community plugin
- `@hassankbrian/capacitor-healthkit` -- fork with Health Connect support

### The Catch: Distribution

Even with Capacitor, you need to distribute the app as a native binary:

1. **TestFlight** -- Free, up to 10,000 testers, no App Store review for external testing (just a light review). User installs TestFlight app, then taps your invite link. Requires Apple Developer Account ($99/year).

2. **App Store** -- Full review process. HealthKit apps face extra scrutiny (Apple requires a privacy policy, clear explanation of data use, and the HealthKit entitlement must be justified).

3. **Enterprise Distribution** -- $299/year Apple Enterprise Developer Program. For internal company use only, not for public apps. Apple cracks down on abuse.

4. **Ad Hoc Distribution** -- Limited to 100 devices per year. Requires registering each device UDID. Not practical.

5. **Web Clip / PWA** -- Does NOT get access to HealthKit. A PWA installed via Safari "Add to Home Screen" runs in a WKWebView sandbox without native entitlements.

### UX Flow with TestFlight

```
1. User clicks link on your web app -> TestFlight invite URL
2. TestFlight app opens (or prompts install from App Store)
3. User taps "Install" in TestFlight
4. App launches, requests HealthKit permission (native dialog)
5. Steps sync automatically in background
```

### Assessment

- UX is actually quite clean via TestFlight
- Automatic background sync (no daily automation needed)
- Real-time data (not once-a-day)
- But: 2 app installs (TestFlight + your app), Apple Developer Account needed
- TestFlight builds expire after 90 days -- you must push a new build

**One-button score:** 3-4 taps (TestFlight install + app install + HealthKit permission)
**App Store required:** TestFlight at minimum ($99/year Apple Developer)
**Cost:** $99/year Apple Developer Program
**Maturity:** HIGH -- Capacitor is production-grade, used by major apps
**Documentation:**
- https://capacitorjs.com/docs
- https://www.npmjs.com/package/@perfood/capacitor-healthkit

---

## OPTION 4: Third-Party Health Data APIs

### 4a. Terra API

**Status:** Requires native SDK for Apple Health. No web-only flow.

Terra's docs explicitly state: "The Mobile SDK is ONLY used to connect to Apple Health, Samsung Health, Google Fit & Health Connect." Apple Health is a "mobile-only source" -- there is no web OAuth flow for it.

**How it works:**
- You embed Terra's iOS SDK (Swift/Kotlin/React Native/Flutter) in a native app
- SDK handles HealthKit authorization and data sync
- Data flows to your backend via webhooks
- For web-based sources (Fitbit, Garmin, Oura, etc.), Terra provides a widget with browser OAuth

**Pricing:** Starting at $499/month (includes 100K credits). Expensive for a side project.

**One-button score:** Same as Capacitor (need a native app) + $499/month
**App Store required:** YES (same as Capacitor)
**Cost:** $499/month minimum
**Documentation:** https://docs.tryterra.co/health-and-fitness-api/mobile-only-sources

### 4b. Sahha API

**Status:** Requires native SDK for Apple Health.

Sahha provides health scores, biomarkers, and behavioral analytics. For data collection from Apple Health, they require their mobile SDK.

**How it works:**
- Embed Sahha SDK in your iOS app
- SDK collects HealthKit data passively
- Data is processed server-side for scores and biomarkers
- REST API and webhooks for delivery

**Pricing:**
- Sandbox: Free (25 users, development only)
- Fully Unlocked: $299/month (up to 1,000 users, $0.40/additional user)
- Custom: As low as $0.05/user/month at scale

**One-button score:** Same as Capacitor (need a native app) + $299/month
**App Store required:** YES
**Cost:** $299/month minimum for production
**Documentation:** https://docs.sahha.ai/docs/connect/sdk

### 4c. Human API

**Status:** Acquired by LexisNexis Risk Solutions. No longer a standalone consumer health API.

Human API was the original "connect your health data" service with a web widget, but it has pivoted to enterprise healthcare/insurance risk assessment. The original consumer health data API appears to be discontinued or wrapped into LexisNexis products.

**One-button score:** N/A -- no longer available for this use case.

### 4d. Vital API

**Status:** Domain appears to have changed or product pivoted.

The original `docs.vital.io` now redirects to a hospital/medical facility page. The developer-focused health data API at `docs.getvital.io` is no longer resolving. Vital may have been acquired or shut down.

**One-button score:** N/A -- service appears unavailable
**Note:** This information should be re-verified as the service may have moved URLs.

---

## OPTION 5: OAuth Providers (Strava, Google Fit)

### 5a. Strava OAuth

**Status:** WORKS -- browser-only, zero native code needed

**How it works:**
1. User must already sync Apple Health to Strava (requires Strava app installed, Apple Health connected in Strava settings)
2. Your PWA redirects to Strava OAuth: `https://www.strava.com/oauth/authorize?client_id=...&scope=activity:read_all`
3. User authorizes your app
4. You get an access token and can call `GET /api/v3/athlete/activities` to get step data

**The catch:**
- Strava is primarily an ACTIVITY tracker, not a step counter
- Strava records activities (runs, rides, walks) but does NOT passively track daily step count
- There is no "daily steps" endpoint in the Strava API
- You can estimate steps from walking/running activities, but it will miss most passive steps

**Pricing:** Free (2,000 requests/day, 200 per 15 minutes)

**One-button score:** 2 taps (OAuth consent) -- but step data is incomplete/missing
**App Store required:** NO (but user needs Strava app separately)
**Cost:** Free
**Documentation:** https://developers.strava.com/docs/getting-started/

### 5b. Google Fit REST API

**Status:** DEPRECATED as of 2024

Google Fit REST API was shut down and replaced by Health Connect (Android-only, on-device API). There is no longer a web/REST API for Google Fit step data.

- Google Fit web API sunset: June 30, 2025
- Replacement: Health Connect (Android only, no web API)
- If user syncs Apple Health -> Google Fit, the data was accessible, but this path is now closed

**One-button score:** N/A -- API deprecated
**Documentation:** https://developers.google.com/fit/rest (shows deprecation notice)

### 5c. Fitbit Web API

**Status:** WORKS -- browser-only OAuth

**How it works:**
1. User must have a Fitbit account and sync Apple Health data to Fitbit (this is NOT straightforward -- Fitbit does not natively read Apple Health; requires a third-party app like "Sync Solver for Fitbit")
2. Your PWA redirects to Fitbit OAuth2
3. You get step data via `GET /1/user/-/activities/date/today.json`

**The catch:**
- Requires user to have Fitbit account + extra sync app
- Fitbit is now owned by Google, future uncertain
- Very roundabout path

**Pricing:** Free tier available
**One-button score:** 2 taps (OAuth) -- but requires complex pre-setup by user
**App Store required:** NO (but user needs Fitbit + sync app)

---

## OPTION 6: iOS 18/19 New Features

### Status: Nothing changes the landscape

**Confidence: MEDIUM** (iOS 19/26 details may still be emerging)

**iOS 18 (2024):**
- No web HealthKit access
- Added: Pregnancy tracking, custom cycles, State of Mind logging
- HealthKit expanded to iPad (iPadOS 17+)

**iOS 19 / iOS 26 (2025 WWDC):**
- Based on the Apple support pages referencing "iOS 26" -- Apple has apparently moved to calendar-year versioning
- No announcements about web-based HealthKit access
- Focus on Apple Intelligence integration, enhanced Siri health queries
- HealthKit continues to be native-framework-only

**The privacy argument:** Apple positions health data privacy as a core differentiator. Making HealthKit accessible via web browsers would fundamentally undermine their "health data stays on your device" marketing. This is a strategic decision, not a technical limitation.

---

## TOP-3 RECOMMENDATIONS (Simplest to Most Complex)

### #1: IMPROVED APPLE SHORTCUTS (RECOMMENDED)

**Setup effort:** ~8 taps (one-time)
**Ongoing effort:** Zero (runs daily via automation)
**Cost:** $0
**App Store:** No

**What to do right now:**
1. Build the actual shortcut on your iPhone with these actions:
   - `Get Clipboard` -> save to variable "token"
   - `If` token is empty -> `Read File` from Shortcuts folder "axs-token.txt" -> set as token
   - `If` token is not empty -> `Save File` token to "axs-token.txt"
   - `Find Health Samples` (Type: Steps, Start: Start of Today, End: Now, Sort: None, Aggregate: Sum)
   - `Get Contents of URL` (POST to `https://axs-tracker.vercel.app/api/health/sync?user_token=[token]`, body: `{"date":"[Current Date yyyy-MM-dd]","steps":[steps],"source":"shortcuts"}`)
2. Share to iCloud, get the permanent link
3. Update `ICLOUD_SHORTCUT_URL` in `setup/page.tsx`
4. Improve the setup page:
   - Single "Connect" button that copies token to clipboard AND redirects to iCloud shortcut link
   - After shortcut is installed, show "Set Up Daily Sync" with clear 3-step instructions for creating an Automation
5. Add a "Test Connection" button that runs the shortcut via `shortcuts://run-shortcut?name=AXS%20Steps%20Sync`

**Improvement over current:** Eliminates manual token paste. Goes from 3+ steps to 2 taps for install, then 5-6 taps for automation.

### #2: CAPACITOR + TESTFLIGHT

**Setup effort:** ~4 taps (install TestFlight, install app, grant HealthKit access)
**Ongoing effort:** Zero (automatic background sync)
**Cost:** $99/year (Apple Developer Program)
**App Store:** TestFlight (no full App Store review)

**What to do:**
1. Add Capacitor to the existing Next.js project: `npm install @capacitor/core @capacitor/cli`
2. Install `@perfood/capacitor-healthkit`
3. Configure HealthKit entitlement and privacy description
4. Build, sign, upload to TestFlight
5. Share TestFlight invite link on the web app for iOS users
6. Web users continue using the PWA

**Pros:** Real-time sync, professional UX, background sync works
**Cons:** $99/year, 90-day build expiry, need to maintain native build pipeline

### #3: STRAVA OAUTH (BROWSER-ONLY FALLBACK)

**Setup effort:** 2 taps (OAuth consent)
**Ongoing effort:** Zero
**Cost:** $0
**App Store:** No

**Why it's #3 not #1:** Strava does NOT provide daily step counts. Only recorded activities. Most passive walking/step data is lost. This only works if your users are active Strava athletes who track all their walks/runs.

**What to do:**
1. Register a Strava API application
2. Add Strava OAuth flow to your settings page
3. On auth, poll the activities API daily and sum step estimates
4. Display as a "Strava Activities" source alongside Shortcuts

---

## GAPS AND LIMITATIONS

1. **No web API exists for Apple Health** -- this is the fundamental constraint. Every "simple" path requires either a native app or a workaround.
2. **Shortcuts automation setup cannot be automated** -- there is no URL scheme to create a Personal Automation. The 5-6 taps for automation setup are unavoidable.
3. **Vital API status is uncertain** -- the docs URL no longer works. If someone finds the current URL, it should be re-evaluated.
4. **iOS 19/26 details are still emerging** -- WWDC 2025 may have announced features not yet documented.
5. **Terra and Sahha pricing may have changed** -- verified as of early 2026 but should be re-checked.

---

## DECISION MATRIX

| Option | User Taps | App Store? | Cost/mo | Step Data Quality | Reliability |
|--------|-----------|------------|---------|------------------|-------------|
| Shortcuts (improved) | ~8 one-time | No | $0 | HIGH (direct HealthKit) | HIGH |
| Capacitor+TestFlight | ~4 one-time | TestFlight | ~$8 ($99/yr) | HIGH (direct HealthKit) | HIGH |
| Terra API | ~4 one-time | Yes | $499+ | HIGH | HIGH |
| Sahha API | ~4 one-time | Yes | $299+ | HIGH | MEDIUM |
| Strava OAuth | ~2 one-time | No | $0 | LOW (activities only) | MEDIUM |
| Google Fit | N/A | N/A | N/A | DEPRECATED | N/A |

---

## FINAL RECOMMENDATION

**Stick with Apple Shortcuts and fix the current implementation.** It is free, requires no App Store, gives HIGH quality step data directly from HealthKit, and the UX can be improved to near-two-taps for the core install. The automation setup is the main friction point, but it is a one-time cost.

The immediate action items:
1. Build and upload the actual Shortcut to iCloud
2. Replace the PLACEHOLDER URL
3. Implement clipboard-auto-copy + redirect on "Connect" button
4. Add clear automation setup instructions with screenshots

If you later want a more polished experience, Capacitor + TestFlight is the logical next step at $99/year.

---

*Sources: Apple Developer Documentation, Terra API Docs, Sahha Docs, Strava Developer Docs, npm registry, Apple Support pages. Last verified: 2026-03-30.*
