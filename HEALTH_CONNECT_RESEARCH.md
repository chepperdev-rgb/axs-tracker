# Apple Health + PWA: Deep Research — Simplest Way to Get Steps

> Research date: 2026-03-30
> Goal: User clicks ONE "Connect" button → steps appear in dashboard
> Context: AXS Tracker already has Shortcuts-based sync (token + iCloud shortcut placeholder)

---

## TL;DR — TOP 3 Recommendations

| Rank | Method | User Effort | App Store? | Cost | Maturity |
|------|--------|-------------|------------|------|----------|
| **#1** | **Apple Shortcuts (improved)** | 2 taps install + 5 taps automation | No | $0 | Production-ready |
| **#2** | **Capacitor + TestFlight** | 1 tap install + 1 tap permission | No (TestFlight) | $99/yr | Solid but maintenance burden |
| **#3** | **Terra/Vital API + companion app** | Install their app + OAuth | Their app in Store | $200-500/mo | Enterprise-grade |

**Winner: Apple Shortcuts (option #1)** — already 80% built, zero cost, no App Store. Just needs the actual iCloud shortcut link and auto-token UX.

---

## The Fundamental Constraint

**Apple does NOT and will NOT expose HealthKit to web browsers.** This is a deliberate architectural decision:
- HealthKit requires native `NSHealthStore` entitlement
- No Web API, no JavaScript bridge, no WebKit access
- iOS 17, 18 — no changes to this policy
- WWDC 2024/2025 — no announcements about web HealthKit

Every solution below is a workaround for this fundamental limitation.

---

## Option 1: Apple Shortcuts (RECOMMENDED — Already Partially Built)

### How it works
1. User taps "Connect Health" in PWA
2. PWA generates unique token, opens iCloud Shortcut link
3. iOS opens Shortcuts app → "Add Shortcut" → one tap
4. User sets up daily Automation (Shortcuts → Automations → Time of Day)
5. Shortcut reads HealthKit steps + POSTs to our API with token

### Current state in AXS Tracker
- `/api/health/sync` — working, accepts Bearer token ✅
- `/api/user/shortcuts-url` — generates `axs-XXXXXXXX` tokens ✅
- `/shortcuts/setup` page — exists but has **PLACEHOLDER** iCloud URL ❌
- `public/shortcuts/steps-shortcut-template.json` — template exists ✅
- Token must be manually copy-pasted — bad UX ❌

### What needs to happen to make it "1 button"
1. **Build the actual Shortcut** on an iPhone, upload to iCloud → get real URL
2. **Auto-embed token in URL**: Use `shortcuts://x-callback-url/run-shortcut?input=text&text={token}` or pass token via clipboard
3. **Simplify setup page**: Auto-copy token → redirect to iCloud shortcut → shortcut reads clipboard on first run
4. **Automation prompt**: Guide user to set up daily automation (can't be automated — iOS limitation)

### User effort (optimized)
1. Tap "Connect Health" (1 tap)
2. "Add Shortcut" in Shortcuts app (1 tap)
3. Run shortcut once to grant HealthKit permission (1 tap)
4. Set up Automation: Shortcuts → Automations → Time of Day → select shortcut (5-6 taps)

**Total: ~8 taps, 2 minutes, no app install**

### Limitations
- Data syncs on schedule (not real-time) — usually once/day
- User must manually set up Automation (Apple doesn't allow installing automations)
- If shortcut breaks, user may not notice

### Cost: $0
### Docs
- Apple Shortcuts User Guide: https://support.apple.com/guide/shortcuts/
- Shortcuts URL schemes: `shortcuts://` (run, open, create)
- iCloud Shortcut sharing: Upload via Shortcuts app → Share → Copy iCloud Link

---

## Option 2: Capacitor + TestFlight (Best UX, Higher Maintenance)

### How it works
1. Wrap Next.js PWA in Capacitor
2. Add `@perfood/capacitor-healthkit` plugin
3. Build iOS app → push to TestFlight
4. User installs via TestFlight link
5. App requests HealthKit permission → real-time step sync

### UX flow
1. Tap TestFlight link → Install (1 tap + wait)
2. Open app → "Allow Health Access" (1 tap)
3. Steps sync automatically in background

**Total: 2 taps + install wait — best UX**

### Limitations
- **$99/year** Apple Developer account
- TestFlight builds expire every **90 days** — must rebuild
- Max **10,000 testers** on TestFlight
- Maintaining native build pipeline (Xcode, certificates, provisioning)
- If you ever want public release → App Store review

### Key resources
- Capacitor: https://capacitorjs.com/docs
- `@perfood/capacitor-healthkit`: https://github.com/niclas9/capacitor-healthkit
- TestFlight: https://developer.apple.com/testflight/

### Cost: $99/year + maintenance time

---

## Option 3: Third-Party Health Data APIs

### Terra API
- **How**: User installs Terra's companion app → OAuth in browser → Terra reads HealthKit → webhooks to your server
- **UX**: Install app + OAuth flow (3-4 steps)
- **Pricing**: Free tier (limited), $499/mo for production
- **Maturity**: Production-grade, used by fitness companies
- **Key issue**: Still requires a native app (Terra's app) on the phone
- **Docs**: https://docs.tryterra.co/

### Vital API
- **How**: Similar to Terra — companion app + OAuth widget
- **UX**: Install Vital app + connect in browser (3-4 steps)
- **Pricing**: Free tier (50 users), then $0.50-2/user/mo
- **Maturity**: Good, YC-backed
- **Docs**: https://docs.tryvital.io/

### Sahha API
- **How**: Native SDK required (no web-only option for HealthKit)
- **UX**: Must embed SDK in native app
- **Pricing**: $299/mo+
- **Not suitable** for PWA without native wrapper

### Human API
- **How**: User connects health accounts via Human API Connect widget
- **UX**: Browser-based widget, but for Apple Health still needs their app
- **Pricing**: Enterprise pricing (contact sales)
- **Docs**: https://www.humanapi.co/

### Verdict on third-party APIs
All of them require a native app on the phone for Apple Health data. They DON'T bypass the HealthKit native-only restriction. They're useful for multi-platform (Fitbit, Garmin, Google Fit) but **overkill for just Apple Health steps**.

---

## Option 4: Strava/Fitness OAuth (Browser-Only, Limited Data)

### Strava API
- **How**: OAuth in browser → access recorded activities
- **UX**: True browser-only OAuth ✅
- **Problem**: Strava does NOT expose passive step counts — only recorded activities (runs, rides, walks user explicitly tracked)
- **Most daily walking steps are invisible to Strava**
- **Pricing**: Free (rate limited)
- **Docs**: https://developers.strava.com/

### Google Fit REST API
- **How**: OAuth in browser → REST API for steps
- **UX**: True browser-only ✅
- **Problem**: Only works if user has Google Fit on iPhone AND syncs Apple Health → Google Fit (rare)
- **Pricing**: Free
- **Note**: Google Fit is being sunset in favor of Health Connect (Android only)

### Verdict
Browser-only OAuth options exist but **don't reliably capture iPhone step data**.

---

## Option 5: iOS 17/18/19 New Features

### iOS 17 (2023)
- HealthKit gains `HKWorkoutActivity` improvements
- No web API changes

### iOS 18 (2024)
- Health app redesign
- Medical ID sharing improvements
- **No web HealthKit API**

### iOS 19 (expected 2025)
- No leaked/announced web HealthKit features
- Apple's stance: Health data stays on-device, accessed only by native apps

### HealthKit on Vision Pro
- Available via native visionOS apps only
- No web bridge

### Verdict
**Apple shows zero indication of ever opening HealthKit to the web.** Privacy is a core selling point.

---

## Option 6: Progressive Enhancement Ideas

### PWA + Shortcuts Hybrid (Best Bang for Buck)
```
Connect → iCloud Shortcut → Daily sync to API
         ↓ fallback
    Manual step input in PWA
```

### PWA + Capacitor Hybrid
```
Web users → Shortcuts sync
TestFlight users → Native HealthKit real-time sync
Both → Same API endpoints, same dashboard
```

---

## Detailed Comparison Matrix

| Criteria | Shortcuts | Capacitor+TF | Terra API | Strava OAuth |
|----------|-----------|--------------|-----------|-------------|
| User taps to connect | ~8 | ~3 | ~10+ | ~4 |
| Needs app install | No (Shortcuts built-in) | Yes (TestFlight) | Yes (Terra app) | No |
| App Store required | No | No (TestFlight) | No (their app) | No |
| Real-time sync | No (scheduled) | Yes | Near real-time | Activity-only |
| Passive steps | Yes | Yes | Yes | No |
| Cost | $0 | $99/yr | $499/mo | $0 |
| Maintenance | Low | High | Medium | Low |
| Already built (%) | 80% | 0% | 0% | 0% |

---

## FINAL RECOMMENDATION

### Do This Now (Option #1 — Shortcuts, Improved)

The Shortcuts integration is **80% built**. To get to "1 button":

1. **Create the actual iCloud Shortcut** — build it on iPhone with:
   - Input: text (token from clipboard)
   - Action: Get Health Samples → Step Count → Today
   - Action: Get Current Date → format YYYY-MM-DD
   - Action: Get Contents of URL → POST to `/api/health/sync`
   - Upload to iCloud → replace PLACEHOLDER URL

2. **Improve token delivery** — instead of copy-paste:
   - "Connect" button → copies token to clipboard automatically
   - Immediately opens `https://www.icloud.com/shortcuts/{ID}`
   - Shortcut on first run reads clipboard → saves token to Shortcuts variable

3. **Add setup verification** — after shortcut runs once:
   - Dashboard shows "Connected ✅" with last sync time
   - If no sync in 24h → show "Check your shortcut" nudge

### Later (Option #2 — Capacitor, if needed)
If user base grows and the Shortcuts UX friction causes drop-off, wrap in Capacitor for native HealthKit access via TestFlight.

### Skip
- Terra/Vital/Sahha — overkill and expensive for single-metric (steps)
- Strava — doesn't capture passive steps
- Waiting for Apple web API — not happening

---

## Key Links

| Resource | URL |
|----------|-----|
| Apple Shortcuts URL Scheme | `shortcuts://run-shortcut?name=NAME&input=text&text=VALUE` |
| iCloud Shortcut Sharing | Upload in Shortcuts app → Share → Copy iCloud Link |
| Capacitor HealthKit Plugin | https://github.com/niclas9/capacitor-healthkit |
| Terra API Docs | https://docs.tryterra.co/ |
| Vital API Docs | https://docs.tryvital.io/ |
| Strava API | https://developers.strava.com/ |
| HealthKit Framework | https://developer.apple.com/documentation/healthkit |
