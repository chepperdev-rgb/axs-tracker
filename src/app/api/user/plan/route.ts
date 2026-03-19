import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in DB
    await db
      .insert(users)
      .values({ id: user.id, email: user.email! })
      .onConflictDoNothing()

    const [dbUser] = await db
      .select({ plan: users.plan, subscriptionStatus: users.subscriptionStatus })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    return NextResponse.json({
      plan: dbUser?.plan || 'free',
      subscriptionStatus: dbUser?.subscriptionStatus || 'none',
    })
  } catch {
    return NextResponse.json({ plan: 'free', subscriptionStatus: 'none' })
  }
}
