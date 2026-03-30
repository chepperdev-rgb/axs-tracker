import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { apiTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'

// GET /api/user/token — get or create shortcuts token
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [existing] = await db.select()
      .from(apiTokens)
      .where(and(
        eq(apiTokens.userId, user.id),
        eq(apiTokens.name, 'shortcuts'),
      ))
      .limit(1)

    let token: string

    if (existing) {
      token = existing.token
    } else {
      token = `axs-${crypto.randomBytes(4).toString('hex')}`
      await db.insert(apiTokens).values({
        userId: user.id,
        token,
        name: 'shortcuts',
      })
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error fetching token:', error)
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 })
  }
}
