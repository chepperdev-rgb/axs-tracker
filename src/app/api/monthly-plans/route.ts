import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPaidPlan } from '@/lib/check-plan'
import { db } from '@/db'
import { monthlyPlans, habits } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/monthly-plans?year=2026&month=3 - Get habits in a monthly plan
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (!(await hasPaidPlan(user.id))) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

    // Get all monthly plans for this user, year, and month with habit details
    const plans = await db
      .select({
        planId: monthlyPlans.id,
        habitId: monthlyPlans.habitId,
        habit: habits,
      })
      .from(monthlyPlans)
      .innerJoin(habits, eq(monthlyPlans.habitId, habits.id))
      .where(
        and(
          eq(monthlyPlans.userId, user.id),
          eq(monthlyPlans.year, year),
          eq(monthlyPlans.month, month)
        )
      )
      .orderBy(habits.sortOrder)

    const habitsInPlan = plans.map(p => ({
      ...p.habit,
      planId: p.planId,
    }))

    return NextResponse.json({ habits: habitsInPlan })
  } catch (error) {
    console.error('Error fetching monthly plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly plans' },
      { status: 500 }
    )
  }
}

// POST /api/monthly-plans - Add a habit to a monthly plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (!(await hasPaidPlan(user.id))) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }

    const body = await request.json()
    const { habitId, year, month } = body

    if (!habitId || typeof habitId !== 'string') {
      return NextResponse.json(
        { error: 'habitId is required' },
        { status: 400 }
      )
    }

    const planYear = year || new Date().getFullYear()
    const planMonth = month || (new Date().getMonth() + 1)

    // Verify the habit belongs to the user
    const [habit] = await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.id, habitId),
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

    // Add to monthly plan (or do nothing if already exists)
    const [plan] = await db
      .insert(monthlyPlans)
      .values({
        userId: user.id,
        habitId,
        year: planYear,
        month: planMonth,
      })
      .onConflictDoNothing()
      .returning()

    // If no plan was returned, it already existed
    if (!plan) {
      const [existingPlan] = await db
        .select()
        .from(monthlyPlans)
        .where(
          and(
            eq(monthlyPlans.userId, user.id),
            eq(monthlyPlans.habitId, habitId),
            eq(monthlyPlans.year, planYear),
            eq(monthlyPlans.month, planMonth)
          )
        )
        .limit(1)

      return NextResponse.json({
        plan: existingPlan,
        habit,
        alreadyExists: true,
      })
    }

    return NextResponse.json({
      plan,
      habit,
      alreadyExists: false,
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding to monthly plan:', error)
    return NextResponse.json(
      { error: 'Failed to add to monthly plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/monthly-plans - Remove a habit from a monthly plan
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (!(await hasPaidPlan(user.id))) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }

    const body = await request.json()
    const { habitId, year, month } = body

    if (!habitId || typeof habitId !== 'string') {
      return NextResponse.json(
        { error: 'habitId is required' },
        { status: 400 }
      )
    }

    const planYear = year || new Date().getFullYear()
    const planMonth = month || (new Date().getMonth() + 1)

    await db
      .delete(monthlyPlans)
      .where(
        and(
          eq(monthlyPlans.userId, user.id),
          eq(monthlyPlans.habitId, habitId),
          eq(monthlyPlans.year, planYear),
          eq(monthlyPlans.month, planMonth)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing from monthly plan:', error)
    return NextResponse.json(
      { error: 'Failed to remove from monthly plan' },
      { status: 500 }
    )
  }
}
