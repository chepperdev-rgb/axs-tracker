import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPaidPlan } from '@/lib/check-plan'
import { db } from '@/db'
import { habitLogs, habits, monthlyPlans } from '@/db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'

// GET /api/habit-logs?month=2026-03 - Get all habit logs for a month
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
    const monthParam = searchParams.get('month') // Format: YYYY-MM

    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json(
        { error: 'month parameter is required in YYYY-MM format' },
        { status: 400 }
      )
    }

    const [year, month] = monthParam.split('-').map(Number)

    // Calculate date range for the month
    const startDate = `${monthParam}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${monthParam}-${String(lastDay).padStart(2, '0')}`

    // Get habits that are in this month's plan
    const plans = await db
      .select()
      .from(monthlyPlans)
      .where(
        and(
          eq(monthlyPlans.userId, user.id),
          eq(monthlyPlans.year, year),
          eq(monthlyPlans.month, month)
        )
      )

    const habitIds = plans.map(p => p.habitId)

    if (habitIds.length === 0) {
      return NextResponse.json({ logs: [] })
    }

    // Get all logs for these habits in the date range
    const logs = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          inArray(habitLogs.habitId, habitIds),
          gte(habitLogs.date, startDate),
          lte(habitLogs.date, endDate),
          eq(habitLogs.completed, true)
        )
      )

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching habit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habit logs' },
      { status: 500 }
    )
  }
}

// POST /api/habit-logs - Toggle a habit completion for a date
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
    const { habitId, date } = body

    if (!habitId || typeof habitId !== 'string') {
      return NextResponse.json(
        { error: 'habitId is required' },
        { status: 400 }
      )
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'date is required in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // Date restriction enforced client-side (monthly/planner pages).
    // Server does NOT enforce today-only because server runs in UTC
    // and would reject valid requests from UTC+ timezone users.

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

    // Check if a log exists for this habit and date
    const [existingLog] = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.date, date)
        )
      )
      .limit(1)

    if (existingLog) {
      // Toggle the completed status
      const newStatus = !existingLog.completed

      if (newStatus) {
        // Mark as completed
        await db
          .update(habitLogs)
          .set({ completed: true })
          .where(eq(habitLogs.id, existingLog.id))
      } else {
        // Delete the log instead of marking as incomplete
        await db
          .delete(habitLogs)
          .where(eq(habitLogs.id, existingLog.id))
      }

      return NextResponse.json({
        log: newStatus ? { ...existingLog, completed: true } : null,
        completed: newStatus
      })
    } else {
      // Create a new log marked as completed
      const [newLog] = await db
        .insert(habitLogs)
        .values({
          habitId,
          date,
          completed: true,
        })
        .returning()

      return NextResponse.json({
        log: newLog,
        completed: true
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error toggling habit log:', error)
    return NextResponse.json(
      { error: 'Failed to toggle habit log' },
      { status: 500 }
    )
  }
}
