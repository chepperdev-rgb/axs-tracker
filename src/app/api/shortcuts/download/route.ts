import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { apiTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// GET /api/shortcuts/download — serves the signed .shortcut with token baked in
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create shortcuts token
    const [existing] = await db.select()
      .from(apiTokens)
      .where(and(eq(apiTokens.userId, user.id), eq(apiTokens.name, 'shortcuts')))
      .limit(1)

    let token: string
    if (existing) {
      token = existing.token
    } else {
      token = `axs-${crypto.randomBytes(4).toString('hex')}`
      await db.insert(apiTokens).values({ userId: user.id, token, name: 'shortcuts' })
    }

    const filePath = path.join(process.cwd(), 'public', 'axs-health-sync-template.shortcut')
    let fileBuffer = fs.readFileSync(filePath)

    // Bake token into shortcut: replace placeholder "AXS_TOKEN_PLACEHOLDER" with real token
    const placeholder = Buffer.from('AXS_TOKEN_PLACEHOLDER')
    const tokenBuf = Buffer.from(token)
    const idx = fileBuffer.indexOf(placeholder)
    if (idx !== -1) {
      // Replace placeholder with token (same length expected — pad with spaces if shorter)
      const replacement = Buffer.alloc(placeholder.length, 0x20) // fill with spaces
      tokenBuf.copy(replacement, 0, 0, Math.min(tokenBuf.length, placeholder.length))
      replacement.copy(fileBuffer, idx)
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="AXS Health Sync.shortcut"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error serving shortcut:', error)
    return NextResponse.json({ error: 'Failed to serve shortcut' }, { status: 500 })
  }
}
