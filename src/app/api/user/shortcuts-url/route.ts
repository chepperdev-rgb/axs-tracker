import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { apiTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'

// GET /api/user/shortcuts-url — get personalized Shortcut install URL
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for existing shortcuts token
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
      // Auto-create short token for shortcuts (axs-XXXXXXXX)
      token = `axs-${crypto.randomBytes(4).toString('hex')}`
      await db.insert(apiTokens).values({
        userId: user.id,
        token,
        name: 'shortcuts',
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axs-tracker.vercel.app'
    const setupUrl = `${baseUrl}/shortcuts/setup?token=${token}`

    return NextResponse.json({ url: setupUrl })
  } catch (error) {
    console.error('Error generating shortcuts URL:', error)
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }
}
