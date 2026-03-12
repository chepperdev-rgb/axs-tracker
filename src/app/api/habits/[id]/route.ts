import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { habits } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/habits/[id] - Get a single habit
export async function GET(request: Request, { params }: RouteParams) {
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

    const [habit] = await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.id, id),
          eq(habits.userId, user.id)
        )
      )
      .limit(1)

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Error fetching habit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    )
  }
}

// PATCH /api/habits/[id] - Update a habit
export async function PATCH(request: Request, { params }: RouteParams) {
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

    const body = await request.json()
    const { name, emoji, category, frequency, frequencyDays, sortOrder, isArchived } = body

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

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (emoji !== undefined) updateData.emoji = emoji
    if (category !== undefined) updateData.category = category
    if (frequency !== undefined) updateData.frequency = frequency
    if (frequencyDays !== undefined) updateData.frequencyDays = frequencyDays
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (isArchived !== undefined) updateData.isArchived = isArchived

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const [updatedHabit] = await db
      .update(habits)
      .set(updateData)
      .where(
        and(
          eq(habits.id, id),
          eq(habits.userId, user.id)
        )
      )
      .returning()

    return NextResponse.json({ habit: updatedHabit })
  } catch (error) {
    console.error('Error updating habit:', error)
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    )
  }
}

// DELETE /api/habits/[id] - Delete a habit
export async function DELETE(request: Request, { params }: RouteParams) {
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

    // Check if habit belongs to user and delete it
    const [deletedHabit] = await db
      .delete(habits)
      .where(
        and(
          eq(habits.id, id),
          eq(habits.userId, user.id)
        )
      )
      .returning()

    if (!deletedHabit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, habit: deletedHabit })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    )
  }
}
