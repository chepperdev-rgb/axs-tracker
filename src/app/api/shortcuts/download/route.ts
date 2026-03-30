import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

// GET /api/shortcuts/download — serves the signed .shortcut template
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filePath = path.join(process.cwd(), 'public', 'axs-health-sync-template.shortcut')
    const fileBuffer = fs.readFileSync(filePath)

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
