import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { healthMetrics, apiTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const syncSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().int().min(0).max(200_000),
  source: z.enum(['manual', 'shortcuts', 'google_fit', 'fitbit']).default('manual'),
})

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const queryToken = req.nextUrl.searchParams.get('user_token')
    let userId: string | null = null

    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const token = bearerToken || queryToken

    if (token) {
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
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }

    const body = await req.json()
    const parsed = syncSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.issues }, { status: 400 })
    }

    const { date, steps, source } = parsed.data

    await db.insert(healthMetrics).values({
      userId,
      date,
      steps,
      source,
      syncedAt: new Date(),
    }).onConflictDoUpdate({
      target: [healthMetrics.userId, healthMetrics.date],
      set: {
        steps,
        source,
        syncedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error syncing health data:', error)
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 })
  }
}
