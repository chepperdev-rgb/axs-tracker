import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { habits, monthlyPlans, users } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { seedDefaultHabits } from '@/lib/seed-habits'
import { hasPaidPlan } from '@/lib/check-plan'

// GET /api/habits - List all habits for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ensure user exists in DB + seed default habits for new users
    await db
      .insert(users)
      .values({ id: user.id, email: user.email! })
      .onConflictDoNothing()
    await seedDefaultHabits(user.id)

    // Check paid plan
    if (!(await hasPaidPlan(user.id))) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1

    // Get all habits for the user
    const userHabits = await db
      .select()
      .from(habits)
      .where(
        includeArchived
          ? eq(habits.userId, user.id)
          : and(eq(habits.userId, user.id), eq(habits.isArchived, false))
      )
      .orderBy(habits.sortOrder, desc(habits.createdAt))

    // Get monthly plans to determine which habits are in the current month
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

    const habitIdsInMonth = new Set(plans.map(p => p.habitId))

    // Add inCurrentMonth flag to each habit
    const habitsWithMonthStatus = userHabits.map(habit => ({
      ...habit,
      inCurrentMonth: habitIdsInMonth.has(habit.id)
    }))

    return NextResponse.json({ habits: habitsWithMonthStatus })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    )
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: Request) {
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
    const { name, emoji, category, frequency, frequencyDays, addToCurrentMonth, locale, translations } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      )
    }

    // Ensure user exists in our database (for new Supabase users)
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email!,
      })
      .onConflictDoNothing()

    // Get the highest sort order for this user
    const existingHabits = await db
      .select({ sortOrder: habits.sortOrder })
      .from(habits)
      .where(eq(habits.userId, user.id))
      .orderBy(desc(habits.sortOrder))
      .limit(1)

    const nextSortOrder = existingHabits.length > 0
      ? (existingHabits[0].sortOrder || 0) + 1
      : 0

    // Build translations object: store habit name per locale
    const habitTranslations = translations || (locale ? { [locale]: name.trim() } : null)

    // Create the habit
    const [newHabit] = await db
      .insert(habits)
      .values({
        userId: user.id,
        name: name.trim(),
        emoji: emoji || null,
        category: category || null,
        frequency: frequency || 'daily',
        frequencyDays: frequencyDays || null,
        translations: habitTranslations,
        sortOrder: nextSortOrder,
      })
      .returning()

    // Optionally add to current month
    let inCurrentMonth = false
    if (addToCurrentMonth) {
      const now = new Date()
      await db
        .insert(monthlyPlans)
        .values({
          userId: user.id,
          habitId: newHabit.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        })
        .onConflictDoNothing()
      inCurrentMonth = true
    }

    return NextResponse.json({
      habit: { ...newHabit, inCurrentMonth }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    )
  }
}
