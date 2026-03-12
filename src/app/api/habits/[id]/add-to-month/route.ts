import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { habits, monthlyPlans } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

type RouteParams = {
  params: Promise<{ id: string }>
}

// POST /api/habits/[id]/add-to-month - Add habit to current (or specified) month
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

    // Parse optional year/month from body
    let year: number
    let month: number

    try {
      const body = await request.json()
      year = body.year || new Date().getFullYear()
      month = body.month || new Date().getMonth() + 1
    } catch {
      // No body provided, use current month
      year = new Date().getFullYear()
      month = new Date().getMonth() + 1
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

    if (existingHabit.isArchived) {
      return NextResponse.json(
        { error: 'Cannot add archived habit to month' },
        { status: 400 }
      )
    }

    // Check if already in month
    const [existingPlan] = await db
      .select()
      .from(monthlyPlans)
      .where(
        and(
          eq(monthlyPlans.habitId, id),
          eq(monthlyPlans.userId, user.id),
          eq(monthlyPlans.year, year),
          eq(monthlyPlans.month, month)
        )
      )
      .limit(1)

    if (existingPlan) {
      return NextResponse.json({
        success: true,
        message: 'Habit already in month',
        habit: { ...existingHabit, inCurrentMonth: true },
        alreadyExists: true
      })
    }

    // Add to monthly plan
    const [newPlan] = await db
      .insert(monthlyPlans)
      .values({
        userId: user.id,
        habitId: id,
        year,
        month,
      })
      .returning()

    return NextResponse.json({
      success: true,
      habit: { ...existingHabit, inCurrentMonth: true },
      monthlyPlan: newPlan
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding habit to month:', error)
    return NextResponse.json(
      { error: 'Failed to add habit to month' },
      { status: 500 }
    )
  }
}

// DELETE /api/habits/[id]/add-to-month - Remove habit from current (or specified) month
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

    // Parse optional year/month from query params
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1

    // Remove from monthly plan
    const deletedPlans = await db
      .delete(monthlyPlans)
      .where(
        and(
          eq(monthlyPlans.habitId, id),
          eq(monthlyPlans.userId, user.id),
          eq(monthlyPlans.year, year),
          eq(monthlyPlans.month, month)
        )
      )
      .returning()

    return NextResponse.json({
      success: true,
      removed: deletedPlans.length > 0
    })
  } catch (error) {
    console.error('Error removing habit from month:', error)
    return NextResponse.json(
      { error: 'Failed to remove habit from month' },
      { status: 500 }
    )
  }
}
