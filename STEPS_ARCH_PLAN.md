# Steps Widget — Architecture Plan

**Author:** @miron (Senior Architect)
**Date:** 2026-03-30
**Status:** Draft — awaiting @artem's data source research
**Priority:** 2-important

---

## 1. Database Schema

### Таблица `health_metrics`

Название generic (`health_metrics`, не `steps`) — в будущем сюда же ляжет sleep, heart rate и т.д.

**Решение: daily snapshot, не history.**
Причина: для виджета на dashboard нужно одно число за день. Хранить данные каждые 15 минут — overhead без use-case. Если позже понадобится intraday — добавим отдельную таблицу.

```
src/db/schema/health-metrics.ts
```

```ts
import { pgTable, uuid, date, integer, text, timestamp, unique, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const healthMetrics = pgTable('health_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  steps: integer('steps'),                          // nullable — может быть null если данных нет
  source: text('source').notNull().default('manual'), // 'manual' | 'shortcuts' | 'google_fit' | 'fitbit'
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Один ряд на юзера на день — upsert по этому constraint
  uniqueUserDate: unique('health_metrics_user_date').on(table.userId, table.date),
  userIdx: index('health_metrics_user_idx').on(table.userId),
  dateIdx: index('health_metrics_date_idx').on(table.date),
}))

export type HealthMetric = typeof healthMetrics.$inferSelect
export type NewHealthMetric = typeof healthMetrics.$inferInsert
```

**Ключевые решения:**
- `unique(userId, date)` — один ряд на юзера на дату. Позволяет `ON CONFLICT ... DO UPDATE` (upsert).
- `source` — текстовое поле, не enum. Добавить новый источник = просто пушить новую строку, без миграции.
- `steps` nullable — таблица generic, позже добавим `sleep_minutes`, `heart_rate` и т.д.
- `syncedAt` — когда данные последний раз обновились (для UI: "synced 5 min ago").

**Миграция:**
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

**Добавить в `src/db/schema/index.ts`:**
```ts
export * from './health-metrics'
```

---

## 2. API Endpoints

### 2.1 Webhook Token — таблица `api_tokens`

Apple Shortcuts не умеет OAuth. Нужен user-specific token для авторизации webhook.

**Решение: token в `Authorization: Bearer <token>` header.**
Не в URL query — токены в URL логируются в access logs, CDN, Vercel logs. Header безопаснее.

```
src/db/schema/api-tokens.ts
```

```ts
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const apiTokens = pgTable('api_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),           // crypto.randomUUID() — 36 chars
  name: text('name').notNull().default('default'),   // 'apple-shortcuts', 'fitbit', etc.
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tokenIdx: index('api_tokens_token_idx').on(table.token),
  userIdx: index('api_tokens_user_idx').on(table.userId),
}))
```

**Генерация токена — Settings UI:**
```
src/app/api/user/api-token/route.ts      — POST (create), GET (list), DELETE (revoke)
```

Юзер заходит в Settings → Health Integrations → "Generate API Token".
Копирует токен, вставляет в Apple Shortcuts action (HTTP header).

---

### 2.2 POST /api/health/sync — Universal Ingest Endpoint

Один endpoint на все источники. Не `/api/health/steps` — generic, для будущих метрик.

```
src/app/api/health/sync/route.ts
```

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { healthMetrics } from '@/db/schema'
import { apiTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod/v4'

const syncSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),   // YYYY-MM-DD
  steps: z.number().int().min(0).max(200_000),       // sanity cap
  source: z.enum(['manual', 'shortcuts', 'google_fit', 'fitbit']).default('manual'),
})

export async function POST(req: NextRequest) {
  // --- Auth: Bearer token OR Supabase session ---
  const authHeader = req.headers.get('authorization')
  let userId: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const [row] = await db.select()
      .from(apiTokens)
      .where(eq(apiTokens.token, token))
      .limit(1)

    if (!row) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    userId = row.userId

    // Update lastUsedAt (fire and forget)
    db.update(apiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiTokens.id, row.id))
      .then(() => {})
  } else {
    // Fallback: Supabase session (for manual input from web UI)
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = user.id
  }

  // --- Validate body ---
  const body = await req.json()
  const parsed = syncSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.issues }, { status: 400 })
  }

  const { date, steps, source } = parsed.data

  // --- Upsert: insert or update if steps is higher ---
  await db.insert(healthMetrics).values({
    userId,
    date,
    steps,
    source,
    syncedAt: new Date(),
  }).onConflictDoUpdate({
    target: [healthMetrics.userId, healthMetrics.date],
    set: {
      steps,          // Всегда перезаписываем — источник отправляет актуальное значение
      source,
      syncedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
```

**Upsert стратегия:**
- `ON CONFLICT (user_id, date) DO UPDATE` — перезаписываем `steps`, `source`, `syncedAt`.
- Не "take max" — источник (Apple Health / Google Fit) уже знает актуальное число. Мы просто принимаем последнее значение.
- Apple Shortcuts будет отправлять текущее кол-во шагов каждый раз — число растёт в течение дня.

---

### 2.3 GET /api/health/steps — Read Steps

```
src/app/api/health/steps/route.ts
```

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { healthMetrics } from '@/db/schema'
import { eq, and, between } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')           // single date: YYYY-MM-DD
  const from = searchParams.get('from')            // range start
  const to = searchParams.get('to')                // range end

  if (date) {
    // Single day
    const [row] = await db.select()
      .from(healthMetrics)
      .where(and(
        eq(healthMetrics.userId, user.id),
        eq(healthMetrics.date, date),
      ))
      .limit(1)

    return NextResponse.json(row ?? { steps: null, date })
  }

  if (from && to) {
    // Range (for weekly/monthly views)
    const rows = await db.select()
      .from(healthMetrics)
      .where(and(
        eq(healthMetrics.userId, user.id),
        between(healthMetrics.date, from, to),
      ))

    return NextResponse.json(rows)
  }

  return NextResponse.json({ error: 'Provide ?date= or ?from=&to=' }, { status: 400 })
}
```

---

## 3. React Query Hook

```
src/hooks/useStepsData.ts
```

```ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface StepsData {
  steps: number | null
  date: string
  source?: string
  syncedAt?: string
}

async function fetchSteps(date: string): Promise<StepsData> {
  const res = await fetch(`/api/health/steps?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch steps')
  return res.json()
}

async function syncSteps(data: { date: string; steps: number; source?: string }) {
  const res = await fetch('/api/health/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, source: data.source ?? 'manual' }),
  })
  if (!res.ok) throw new Error('Failed to sync steps')
  return res.json()
}

export function useStepsData(date: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['steps', date],
    queryFn: () => fetchSteps(date),
    staleTime: 60 * 1000,          // 1 min — steps don't change per second
    refetchInterval: 5 * 60 * 1000, // Poll every 5 min (webhook pushes are near-realtime anyway)
  })

  const mutation = useMutation({
    mutationFn: syncSteps,
    onMutate: async (newData) => {
      // Optimistic update for manual input
      await queryClient.cancelQueries({ queryKey: ['steps', newData.date] })
      const prev = queryClient.getQueryData<StepsData>(['steps', newData.date])
      queryClient.setQueryData(['steps', newData.date], {
        steps: newData.steps,
        date: newData.date,
        source: 'manual',
      })
      return { prev }
    },
    onError: (_err, newData, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['steps', newData.date], context.prev)
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['steps', vars.date] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  return {
    steps: query.data?.steps ?? null,
    source: query.data?.source,
    syncedAt: query.data?.syncedAt,
    isLoading: query.isLoading,
    updateSteps: mutation.mutate,
    isUpdating: mutation.isPending,
  }
}
```

**Polling стратегия:**
- `refetchInterval: 5 min` — фоновый polling для случаев когда webhook задерживается.
- При manual input — optimistic update, данные появляются мгновенно.
- `staleTime: 1 min` — при переключении вкладок не рефетчит чаще раза в минуту.

---

## 4. Dashboard Widget Component

```
src/components/dashboard/steps-widget.tsx
```

Минимальный виджет — вписывается в существующий grid на dashboard (рядом с KPI cards).

```tsx
'use client'

import { useStepsData } from '@/hooks/useStepsData'

interface StepsWidgetProps {
  date: string                     // YYYY-MM-DD (today)
  goal?: number                    // default 10000
}

export function StepsWidget({ date, goal = 10_000 }: StepsWidgetProps) {
  const { steps, source, syncedAt, isLoading } = useStepsData(date)

  const progress = steps ? Math.min((steps / goal) * 100, 100) : 0

  // ... render: circular progress, step count, source badge, "synced X min ago"
}
```

**Интеграция в dashboard:**
Добавить в `src/app/(app)/dashboard/page.tsx` в grid секцию, рядом с existing KPI cards.

---

## 5. Apple Shortcuts Webhook Flow

```
┌──────────────┐    HTTP POST     ┌────────────────────────┐
│    iPhone     │ ───────────────→ │  POST /api/health/sync │
│  Shortcuts    │   Bearer: token  │  (Next.js API route)   │
│  Automation   │   { steps, date }│                        │
└──────────────┘                   └──────────┬─────────────┘
                                              │
                                     Validate token
                                     Zod parse body
                                     Upsert health_metrics
                                              │
                                              ▼
                                   ┌──────────────────┐
                                   │  Supabase PG     │
                                   │  health_metrics   │
                                   └──────────────────┘
```

**Apple Shortcuts Automation Setup:**
1. Trigger: "Every day at 8:00, 12:00, 18:00, 22:00" (или Personal Automation → Time of Day)
2. Actions:
   - Get Health Sample → Steps → Today
   - URL: `https://axs-tracker.vercel.app/api/health/sync`
   - Method: POST
   - Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
   - Body: `{"date":"<Current Date formatted YYYY-MM-DD>","steps":<Steps>,"source":"shortcuts"}`

**Частота синхронизации:**
- 4 раза в день достаточно для daily dashboard. Не нужен realtime.
- Юзер может в любой момент открыть Shortcut и запустить вручную.

---

## 6. Security Model

| Аспект | Решение |
|--------|---------|
| Webhook auth | Bearer token в header (не в URL) |
| Token storage | `api_tokens` table, indexed by token |
| Token generation | `crypto.randomUUID()` — 122 bits entropy |
| Token revocation | DELETE from `api_tokens` |
| Rate limiting | Vercel Edge — 60 req/min на IP (стандартный) |
| Input validation | Zod schema, max steps 200K (sanity check) |
| Web UI auth | Supabase session (existing pattern) |
| Dual auth | Bearer token OR Supabase session — один endpoint |

**Почему НЕ token в URL query:**
- URL логируется в Vercel logs, CDN access logs, browser history
- `Authorization` header не логируется по умолчанию
- Stripe webhook использует тот же подход (signature в header)

---

## 7. File Map — What to Create/Modify

### New files:
```
src/db/schema/health-metrics.ts          — DB schema
src/db/schema/api-tokens.ts              — Token table
src/app/api/health/sync/route.ts         — POST webhook ingest
src/app/api/health/steps/route.ts        — GET steps data
src/app/api/user/api-token/route.ts      — Token CRUD
src/hooks/useStepsData.ts                — React Query hook
src/components/dashboard/steps-widget.tsx — Dashboard widget
```

### Modified files:
```
src/db/schema/index.ts                   — add exports for new schemas
src/app/(app)/dashboard/page.tsx         — add StepsWidget to grid
src/app/(app)/settings/page.tsx          — add "Health Integrations" section (token management)
```

### NOT needed (avoid overengineering):
- No cron jobs — Shortcuts pushes data on schedule
- No OAuth flow yet — wait for @artem's research on Google Fit/Fitbit
- No WebSocket/SSE — polling every 5 min is fine for steps
- No separate microservice — it's one table and two routes
- No Redis cache — Postgres is fast enough for single-row lookups

---

## 8. Migration Path — Phased Implementation

### Phase 1: Core (this sprint)
1. DB schema + migration (`health_metrics`, `api_tokens`)
2. POST `/api/health/sync` with Bearer auth
3. GET `/api/health/steps`
4. `useStepsData` hook
5. Basic `StepsWidget` on dashboard
6. Token management in Settings

### Phase 2: After @artem's Research
7. Google Fit OAuth flow (if viable)
8. Fitbit OAuth flow (if viable)
9. Additional metrics (sleep, heart rate) — add columns to `health_metrics`

### Phase 3: Polish
10. Weekly/monthly steps chart on dashboard
11. Steps goal setting (user preference)
12. Steps in daily planner view

---

## 9. Env Variables

```env
# No new env vars needed for Phase 1!
# Token auth uses DB-stored tokens, not env secrets.
# Google Fit / Fitbit will need OAuth credentials in Phase 2.
```

---

## 10. Open Questions for @artem

1. **Apple Shortcuts** — может ли Automation запускаться без подтверждения юзером? (iOS 15+ может, но нужно проверить)
2. **Google Fit** — требуется ли Google Cloud проект + OAuth consent screen review?
3. **Fitbit** — есть ли webhook (subscription API) или только polling?
4. **Apple Health on Web** — есть ли способ получить данные кроме Shortcuts? (HealthKit → CloudKit?)
