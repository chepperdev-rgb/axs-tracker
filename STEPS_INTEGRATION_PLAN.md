# Steps Integration Plan — AXS Tracker

> Research date: 2026-03-30 | Project: Next.js 15 + Supabase PWA

---

## 1. Comparative Table

| Method | Complexity | Reliability | iOS | Android | Dev Time | Notes |
|---|:---:|---|:---:|:---:|---|---|
| **Apple Shortcuts + Webhook** | 2/5 | Auto daily (iOS 16+), manual fallback | YES | NO | 1 day | Best for iPhone users |
| **Fitbit Web API** | 3/5 | Fully automatic (OAuth polling) | YES | YES | 2 days | Best cross-platform |
| **Google Fit REST API** | - | DEAD | - | - | - | Shut down June 2025 |
| **Web Bluetooth** | - | NOT VIABLE | NO (Safari) | Partial | - | Proprietary BLE protocols |
| **Garmin Connect API** | 4/5 | Auto (webhook push) | YES | YES | 3 days | OAuth 1.0a, review process |
| **Withings API** | 3/5 | Auto (webhook push) | YES | YES | 2 days | Smaller user base |
| **Capacitor + HealthKit** | 5/5 | Fully auto, native access | YES | YES | 5-10 days | Requires App Store |
| **Manual Input** | 1/5 | Depends on user discipline | YES | YES | 0.5 day | Always-available fallback |

---

## 2. Recommendation

### TOP-2 to implement:

#### PRIMARY: Apple Shortcuts + Webhook (iPhone users = main audience)
- Zero dependencies, zero third-party API keys
- Time-of-Day automation runs daily at 11 PM without confirmation (iOS 16+)
- Home Screen shortcut as one-tap manual fallback
- User generates API key in settings, pastes into Shortcut
- **Why this wins:** Your PWA is mobile-first on iPhone. This gives HealthKit access without leaving the web paradigm.

#### SECONDARY: Manual Input (universal fallback)
- Simple number field on dashboard
- Works for everyone regardless of device/setup
- Takes 5 seconds per day
- Can be enhanced later with Fitbit/Garmin OAuth when user base grows

#### FUTURE (v2): Fitbit Web API
- Best option for users with Fitbit/Pixel Watch
- Standard OAuth2 + PKCE flow
- Daily polling via cron or on-demand
- Add when there's user demand

---

## 3. Detailed Implementation Plan

### 3.1 Database Schema

New table `health_metrics`:

```sql
-- Migration: add_health_metrics_table.sql

CREATE TABLE health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER NOT NULL DEFAULT 0,
  steps_goal INTEGER NOT NULL DEFAULT 10000,
  source TEXT NOT NULL DEFAULT 'manual',  -- 'manual' | 'apple_shortcuts' | 'fitbit' | 'garmin'
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT health_metrics_user_date_unique UNIQUE (user_id, date)
);

CREATE INDEX health_metrics_user_date_idx ON health_metrics (user_id, date);

ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health metrics"
  ON health_metrics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own health metrics"
  ON health_metrics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own health metrics"
  ON health_metrics FOR UPDATE
  USING (user_id = auth.uid());
```

Add to `users` table:

```sql
ALTER TABLE users
  ADD COLUMN health_api_key TEXT,
  ADD COLUMN steps_goal INTEGER NOT NULL DEFAULT 10000;
```

### 3.2 Drizzle Schema

**New file:** `src/db/schema/health-metrics.ts`

```typescript
import { pgTable, uuid, integer, text, date, timestamp, unique, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const healthMetrics = pgTable('health_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  steps: integer('steps').notNull().default(0),
  stepsGoal: integer('steps_goal').notNull().default(10000),
  source: text('source').notNull().default('manual'),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique('health_metrics_user_date_unique').on(table.userId, table.date),
  index('health_metrics_user_date_idx').on(table.userId, table.date),
])

export type HealthMetric = typeof healthMetrics.$inferSelect
export type NewHealthMetric = typeof healthMetrics.$inferInsert
```

**Update:** `src/db/schema/users.ts` — add `healthApiKey` and `stepsGoal` fields.

**Update:** `src/db/schema/index.ts` — export new schema.

### 3.3 API Endpoints

#### `POST /api/health/sync` — External sync (Shortcuts / integrations)

Auth: API key in body (no cookies — Shortcuts can't do browser auth).

```typescript
// src/app/api/health/sync/route.ts

import { db } from '@/db'
import { users, healthMetrics } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { steps, date, apiKey } = body

  if (!apiKey || !steps || !date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Validate API key
  const [user] = await db.select().from(users).where(eq(users.healthApiKey, apiKey)).limit(1)
  if (!user) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // Validate steps is a positive integer
  const stepsNum = Math.round(Number(steps))
  if (isNaN(stepsNum) || stepsNum < 0 || stepsNum > 500000) {
    return NextResponse.json({ error: 'Invalid steps value' }, { status: 400 })
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  // Upsert: update if exists, insert if not
  await db.insert(healthMetrics).values({
    userId: user.id,
    date,
    steps: stepsNum,
    stepsGoal: user.stepsGoal ?? 10000,
    source: 'apple_shortcuts',
  }).onConflictDoUpdate({
    target: [healthMetrics.userId, healthMetrics.date],
    set: {
      steps: stepsNum,
      source: 'apple_shortcuts',
      syncedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, steps: stepsNum, date })
}
```

#### `GET /api/health/steps` — Get steps for dashboard

Auth: Supabase session (cookie-based, standard app auth).

```typescript
// src/app/api/health/steps/route.ts

import { db } from '@/db'
import { healthMetrics } from '@/db/schema'
import { eq, and, desc, gte } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  // Get today's steps
  const [todayData] = await db.select()
    .from(healthMetrics)
    .where(and(eq(healthMetrics.userId, user.id), eq(healthMetrics.date, today)))
    .limit(1)

  // Get last 7 days for sparkline
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const weekData = await db.select()
    .from(healthMetrics)
    .where(and(
      eq(healthMetrics.userId, user.id),
      gte(healthMetrics.date, sevenDaysAgo.toISOString().split('T')[0])
    ))
    .orderBy(desc(healthMetrics.date))

  return NextResponse.json({
    today: {
      steps: todayData?.steps ?? 0,
      goal: todayData?.stepsGoal ?? 10000,
      source: todayData?.source ?? null,
      syncedAt: todayData?.syncedAt ?? null,
    },
    week: weekData.map(d => ({ date: d.date, steps: d.steps })),
  })
}
```

#### `POST /api/health/steps` — Manual input

Auth: Supabase session.

```typescript
// src/app/api/health/steps/route.ts (add to same file)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { steps } = await request.json()
  const stepsNum = Math.round(Number(steps))
  if (isNaN(stepsNum) || stepsNum < 0 || stepsNum > 500000) {
    return NextResponse.json({ error: 'Invalid steps' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  await db.insert(healthMetrics).values({
    userId: user.id,
    date: today,
    steps: stepsNum,
    source: 'manual',
  }).onConflictDoUpdate({
    target: [healthMetrics.userId, healthMetrics.date],
    set: { steps: stepsNum, source: 'manual', syncedAt: new Date() },
  })

  return NextResponse.json({ ok: true, steps: stepsNum })
}
```

#### `POST /api/health/api-key` — Generate/regenerate API key

```typescript
// src/app/api/health/api-key/route.ts

import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = `axs_${randomBytes(24).toString('hex')}`

  await db.update(users)
    .set({ healthApiKey: apiKey })
    .where(eq(users.id, user.id))

  return NextResponse.json({ apiKey })
}
```

### 3.4 Files to Create/Modify

```
NEW FILES:
  src/db/schema/health-metrics.ts          — Drizzle schema
  src/app/api/health/sync/route.ts         — External sync endpoint (Shortcuts)
  src/app/api/health/steps/route.ts        — GET today's steps + POST manual input
  src/app/api/health/api-key/route.ts      — Generate API key
  src/components/dashboard/steps-widget.tsx — Dashboard widget
  src/components/dashboard/steps-setup.tsx  — Onboarding/setup modal
  src/hooks/useSteps.ts                    — React Query hook

MODIFIED FILES:
  src/db/schema/users.ts                   — Add healthApiKey, stepsGoal
  src/db/schema/index.ts                   — Export healthMetrics
  src/app/(app)/dashboard/page.tsx         — Add StepsWidget to grid
  src/locales/en.json                      — Add steps-related translations
  src/locales/ru.json                      — Same
```

### 3.5 Dashboard Widget Component

```tsx
// src/components/dashboard/steps-widget.tsx

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Footprints } from 'lucide-react'
import { useSteps } from '@/hooks/useSteps'

export function StepsWidget() {
  const { data, isLoading } = useSteps()
  const [manualInput, setManualInput] = useState('')
  const [showInput, setShowInput] = useState(false)

  if (isLoading) return <StepsSkeleton />

  const steps = data?.today?.steps ?? 0
  const goal = data?.today?.goal ?? 10000
  const pct = Math.min((steps / goal) * 100, 100)
  const lastSync = data?.today?.syncedAt
    ? new Date(data.today.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  // SVG arc for circular progress
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <Card className="glass-card p-4 sm:p-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs sm:text-sm font-medium text-[#b0b0b0]">Steps Today</span>
        </div>
        {lastSync && (
          <span className="text-[10px] text-[#606060]">synced {lastSync}</span>
        )}
      </div>

      {/* Circular Progress + Number */}
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r={radius} fill="none"
              stroke="#2a2a2a" strokeWidth="6" />
            {/* Progress arc */}
            <circle cx="50" cy="50" r={radius} fill="none"
              stroke="url(#goldGradient)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out" />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#f0d060" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gold-gradient">
              {steps.toLocaleString()}
            </span>
            <span className="text-[9px] text-[#707070]">/ {goal.toLocaleString()}</span>
          </div>
        </div>

        {/* Right side: sparkline + percentage */}
        <div className="flex-1">
          <div className="text-2xl font-bold text-[#f5f5f5]">
            {Math.round(pct)}%
          </div>
          <div className="text-xs text-[#707070] mt-1">
            {steps >= goal ? 'Goal reached!' : `${(goal - steps).toLocaleString()} to go`}
          </div>

          {/* Mini week sparkline */}
          {data?.week && data.week.length > 0 && (
            <div className="flex items-end gap-0.5 h-4 mt-3">
              {data.week.slice(0, 7).reverse().map((d, i) => (
                <div key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${Math.max((d.steps / goal) * 100, 5)}%`,
                    backgroundColor: `rgba(212, 175, 55, ${0.3 + Math.min(d.steps / goal, 1) * 0.7})`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual input toggle */}
      {!data?.today?.source && (
        <button
          onClick={() => setShowInput(!showInput)}
          className="mt-3 text-xs text-[#d4af37] hover:text-[#f0d060] transition-colors"
        >
          + Log steps manually
        </button>
      )}

      {showInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder="8000"
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-1.5
              text-sm text-[#f5f5f5] focus:border-[#d4af37] focus:outline-none"
          />
          <button
            onClick={() => {/* call POST /api/health/steps */}}
            className="btn-luxury px-3 py-1.5 text-xs rounded"
          >
            Save
          </button>
        </div>
      )}
    </Card>
  )
}

function StepsSkeleton() {
  return (
    <Card className="glass-card p-4 sm:p-5">
      <div className="animate-pulse">
        <div className="h-3 w-24 bg-[#2a2a2a] rounded mb-4" />
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-[#2a2a2a]" />
          <div className="flex-1">
            <div className="h-6 w-16 bg-[#2a2a2a] rounded mb-2" />
            <div className="h-3 w-24 bg-[#2a2a2a] rounded" />
          </div>
        </div>
      </div>
    </Card>
  )
}
```

### 3.6 React Query Hook

```typescript
// src/hooks/useSteps.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useSteps() {
  return useQuery({
    queryKey: ['health', 'steps'],
    queryFn: async () => {
      const res = await fetch('/api/health/steps')
      if (!res.ok) throw new Error('Failed to fetch steps')
      return res.json()
    },
    staleTime: 60_000,        // 1 min
    refetchInterval: 300_000,  // 5 min
  })
}

export function useLogSteps() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (steps: number) => {
      const res = await fetch('/api/health/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps }),
      })
      if (!res.ok) throw new Error('Failed to log steps')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health', 'steps'] }),
  })
}
```

### 3.7 Dashboard Integration

Add to the dashboard grid (in `page.tsx`) as a new card, alongside existing KPI cards:

```tsx
// In the grid section, add:
<StepsWidget />
```

Position: First row, rightmost column — or as a standalone row between KPI cards and charts.

### 3.8 Apple Shortcuts Setup (Onboarding Flow)

#### User flow:
1. User goes to **Settings > Health Integration**
2. Clicks "Generate API Key" → gets `axs_abc123...`
3. Sees step-by-step instructions with screenshots:
   - Open **Shortcuts** app on iPhone
   - Create new Shortcut with these actions (or tap "Install Shortcut" link)
   - Go to **Automation** tab → New Automation → **Time of Day** → 11:00 PM → **Run Immediately**
   - Set action: Run Shortcut → "AXS Step Sync"
4. Done. Steps sync daily at 11 PM automatically.

#### Shortcut template (user creates manually or via shared link):

```
Shortcut: "AXS Step Sync"

Actions:
1. Find Health Samples
   - Type: Step Count
   - Start Date: Start of Today
   - End Date: Now
   - Group By: Day

2. Calculate Statistics
   - Input: Health Samples
   - Operation: Sum
   → Variable: totalSteps

3. Format Date
   - Date: Current Date
   - Format: Custom → yyyy-MM-dd
   → Variable: todayDate

4. Get Contents of URL
   - URL: https://YOUR-DOMAIN/api/health/sync
   - Method: POST
   - Headers:
     Content-Type: application/json
   - Body (JSON):
     steps: [totalSteps]
     date: [todayDate]
     apiKey: [YOUR_API_KEY]
```

#### iOS Automation Confirmation Status (CRITICAL FINDING):

| iOS Version | Time-of-Day Trigger | Needs Confirmation? |
|---|---|---|
| iOS 15.4+ | Time of Day | Toggle "Ask Before Running" → OFF |
| iOS 16+ | Time of Day | Defaults to "Run Immediately" |
| iOS 17+ | Time of Day | Runs silently, notification only |
| iOS 18+ | Time of Day | Fully silent option available |

**VERDICT: Time-of-Day automation does NOT require confirmation on iOS 16+.** It runs automatically. A small notification banner appears briefly but requires no interaction.

**Workaround for older iOS:** Add a Home Screen shortcut icon. One tap syncs steps instantly.

### 3.9 Settings Page — Health Integration Section

```tsx
// Add to src/app/(app)/settings/page.tsx or new component

// Shows:
// 1. "Health Data" section header
// 2. Steps Goal input (default 10000)
// 3. API Key generation/display
// 4. Instructions for Shortcuts setup
// 5. "Test Connection" button that runs the shortcut URL scheme:
//    shortcuts://run-shortcut?name=AXS%20Step%20Sync
// 6. Last sync status indicator
```

---

## 4. Time Estimates

| Task | Time |
|---|---|
| DB migration + Drizzle schema | 30 min |
| API endpoints (sync, steps, api-key) | 1 hour |
| StepsWidget component | 1.5 hours |
| useSteps hook | 15 min |
| Dashboard integration | 15 min |
| Settings page (health section) | 1 hour |
| Shortcut template + instructions | 30 min |
| i18n translations | 30 min |
| Testing & polish | 1 hour |
| **TOTAL** | **~6 hours** |

---

## 5. Security Considerations

- **API key**: Hash with bcrypt before storing in DB; compare hashes on sync requests (or use constant-time comparison for plain keys since they're random)
- **Rate limiting**: Add rate limit to `/api/health/sync` — max 100 requests/day per API key
- **Input validation**: Steps must be 0-500,000 integer; date must be valid ISO format and not in the future
- **RLS**: Supabase Row Level Security on `health_metrics` table
- **CORS**: The `/api/health/sync` endpoint needs no CORS restrictions (Shortcuts sends direct HTTP, not browser requests)

---

## 6. Future Enhancements (v2)

1. **Fitbit OAuth Integration** — for users with Fitbit/Pixel Watch (2 days)
2. **Weekly/Monthly step analytics** — charts on dashboard showing step trends
3. **Step goal as a habit** — auto-complete a "10k steps" habit when goal is reached
4. **Shortcut install link** — host an `.shortcut` file or use iCloud sharing link for one-tap install
5. **Multiple metrics** — distance, calories, active minutes (same Shortcuts pattern)
6. **Capacitor wrapper** — if app goes native, switch to direct HealthKit access

---

## Appendix A: Why NOT Other Options

| Option | Why Not |
|---|---|
| **Google Fit API** | Shut down June 2025. No replacement web API. |
| **Web Bluetooth** | Safari doesn't support it. Fitness trackers use proprietary protocols. |
| **Health Connect (Android)** | No web/REST API. Native Android SDK only. |
| **Capacitor** | Requires App Store distribution. Overkill for step counting. |
| **Garmin API** | OAuth 1.0a is painful. Application review required. Small user overlap. |

## Appendix B: Shortcut URL Scheme

To trigger the shortcut from within the web app (one-tap sync button):

```
shortcuts://run-shortcut?name=AXS%20Step%20Sync
```

This opens the Shortcuts app and runs the shortcut immediately. The web app can then poll `/api/health/steps` to confirm data arrived.

For a "deep link back" flow:
```
shortcuts://run-shortcut?name=AXS%20Step%20Sync&input=text&text=callback
```

The shortcut can open a URL at the end to redirect back to the web app:
```
Action: Open URLs → https://your-domain/dashboard?synced=1
```
