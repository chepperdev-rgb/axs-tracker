import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { apiTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import crypto from 'crypto'

const createTokenSchema = z.object({
  name: z.string().min(1).max(100).default('default'),
})

// GET /api/user/api-token — list tokens (without token values)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokens = await db.select({
      id: apiTokens.id,
      name: apiTokens.name,
      token: apiTokens.token,
      lastUsedAt: apiTokens.lastUsedAt,
      createdAt: apiTokens.createdAt,
    })
      .from(apiTokens)
      .where(eq(apiTokens.userId, user.id))

    // Mask tokens — only show last 4 chars
    const masked = tokens.map(t => ({
      ...t,
      token: `****${t.token.slice(-4)}`,
    }))

    return NextResponse.json(masked)
  } catch (error) {
    console.error('Error fetching tokens:', error)
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
  }
}

// POST /api/user/api-token — create new token
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createTokenSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.issues }, { status: 400 })
    }

    const token = crypto.randomUUID()

    await db.insert(apiTokens).values({
      userId: user.id,
      token,
      name: parsed.data.name,
    })

    return NextResponse.json({ token }, { status: 201 })
  } catch (error) {
    console.error('Error creating token:', error)
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  }
}

// DELETE /api/user/api-token?id=xxx — revoke token
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Token id is required' }, { status: 400 })
    }

    const result = await db.delete(apiTokens)
      .where(and(
        eq(apiTokens.id, id),
        eq(apiTokens.userId, user.id),
      ))
      .returning({ id: apiTokens.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting token:', error)
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 })
  }
}
