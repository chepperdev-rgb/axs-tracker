import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { healthMetrics, apiTokens } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET /api/health/status — returns whether user has ever synced health data
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ connected: false }, { status: 401 })
    }

    // Check if user has any health metrics synced via shortcuts
    const [lastSync] = await db.select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, user.id))
      .orderBy(desc(healthMetrics.date))
      .limit(1)

    // Also check if user has a shortcuts token (means they at least downloaded it)
    const [token] = await db.select()
      .from(apiTokens)
      .where(eq(apiTokens.userId, user.id))
      .limit(1)

    return NextResponse.json({
      connected: !!lastSync,
      lastSyncDate: lastSync?.date ?? null,
      lastSyncSteps: lastSync?.steps ?? null,
      hasToken: !!token,
    })
  } catch (error) {
    console.error('Error checking health status:', error)
    return NextResponse.json({ connected: false }, { status: 500 })
  }
}
