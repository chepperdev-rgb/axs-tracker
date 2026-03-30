import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { healthMetrics } from '@/db/schema'
import { eq, and, between } from 'drizzle-orm'
import { z } from 'zod'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (date) {
      if (!dateSchema.safeParse(date).success) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }

      const [row] = await db.select()
        .from(healthMetrics)
        .where(and(
          eq(healthMetrics.userId, user.id),
          eq(healthMetrics.date, date),
        ))
        .limit(1)

      return NextResponse.json({
        steps: row?.steps ?? null,
        source: row?.source ?? null,
        syncedAt: row?.syncedAt ?? null,
        goal: 10000,
        date,
      })
    }

    if (from && to) {
      if (!dateSchema.safeParse(from).success || !dateSchema.safeParse(to).success) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }

      const rows = await db.select()
        .from(healthMetrics)
        .where(and(
          eq(healthMetrics.userId, user.id),
          between(healthMetrics.date, from, to),
        ))

      return NextResponse.json(rows)
    }

    return NextResponse.json({ error: 'Provide ?date= or ?from=&to=' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching steps:', error)
    return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 })
  }
}
