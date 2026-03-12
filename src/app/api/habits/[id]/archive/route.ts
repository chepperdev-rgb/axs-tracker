import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { habits, monthlyPlans } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

type RouteParams = {
  params: Promise<{ id: string }>
}

// POST /api/habits/[id]/archive - Archive a habit
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if habit belongs to user
    const [existingHabit] = await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.id, id),
          eq(habits.userId, user.id)
        )
      )
      .limit(1)

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    // Toggle archive status
    const newArchivedStatus = !existingHabit.isArchived

    // Update habit to archived
    const [updatedHabit] = await db
      .update(habits)
      .set({ isArchived: newArchivedStatus })
      .where(
        and(
          eq(habits.id, id),
          eq(habits.userId, user.id)
        )
      )
      .returning()

    // If archiving, also remove from current month plans
    if (newArchivedStatus) {
      await db
        .delete(monthlyPlans)
        .where(
          and(
            eq(monthlyPlans.habitId, id),
            eq(monthlyPlans.userId, user.id)
          )
        )
    }

    return NextResponse.json({
      success: true,
      habit: { ...updatedHabit, inCurrentMonth: false },
      archived: newArchivedStatus
    })
  } catch (error) {
    console.error('Error archiving habit:', error)
    return NextResponse.json(
      { error: 'Failed to archive habit' },
      { status: 500 }
    )
  }
}
