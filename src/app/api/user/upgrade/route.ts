import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update user plan to premium
    await db
      .update(users)
      .set({
        plan: 'premium',
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({
      success: true,
      plan: 'premium',
      message: 'Welcome to Premium!'
    })
  } catch (error) {
    console.error('Error upgrading user:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade' },
      { status: 500 }
    )
  }
}
