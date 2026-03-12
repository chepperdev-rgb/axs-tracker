import { NextResponse } from 'next/server'
import { db } from '@/db'
import { habits, habitLogs, monthlyPlans } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Get current week bounds (Monday to Sunday)
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + mondayOffset)
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    // Get current month bounds
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const monthStartStr = monthStart.toISOString().split('T')[0]
    const monthEndStr = monthEnd.toISOString().split('T')[0]

    // Get last 35 days for heatmap
    const heatmapStart = new Date(now)
    heatmapStart.setDate(now.getDate() - 34)
    const heatmapStartStr = heatmapStart.toISOString().split('T')[0]

    // Get habits for this user that are in the current monthly plan
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const userHabitsInPlan = await db
      .select({
        habitId: habits.id,
        habitName: habits.name,
        frequency: habits.frequency,
        frequencyDays: habits.frequencyDays,
      })
      .from(habits)
      .innerJoin(monthlyPlans, eq(habits.id, monthlyPlans.habitId))
      .where(
        and(
          eq(habits.userId, userId),
          eq(habits.isArchived, false),
          eq(monthlyPlans.year, currentYear),
          eq(monthlyPlans.month, currentMonth)
        )
      )

    const habitIds = userHabitsInPlan.map(h => h.habitId)
    const totalHabitsInPlan = habitIds.length

    // If no habits in plan, return default stats
    if (totalHabitsInPlan === 0) {
      return NextResponse.json({
        weeklyCompletion: 0,
        monthlyScore: 0,
        completionRatio: 0,
        tasksCompletedThisWeek: 0,
        totalTasksThisWeek: 0,
        tasksCompletedToday: 0,
        totalTasksToday: 0,
        bestDay: { day: 'N/A', percentage: 0 },
        monthlyCompletion: 0,
        checkIns: 0,
        activeDays: 0,
        bestStreak: 0,
        heatmapData: Array(35).fill({ date: '', percentage: 0 }),
        weeklyData: [0, 0, 0, 0, 0, 0, 0],
        habitsInPlan: 0,
      })
    }

    // Get all completed habit logs for this week
    const weeklyLogs = await db
      .select({
        habitId: habitLogs.habitId,
        date: habitLogs.date,
        completed: habitLogs.completed,
      })
      .from(habitLogs)
      .where(
        and(
          sql`${habitLogs.habitId} IN (${sql.join(habitIds.map(id => sql`${id}::uuid`), sql`, `)})`,
          gte(habitLogs.date, weekStartStr),
          lte(habitLogs.date, weekEndStr),
          eq(habitLogs.completed, true)
        )
      )

    // Calculate which habits should be done each day based on frequency
    const getDayName = (date: Date): string => {
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      return days[date.getDay()]
    }

    const shouldHabitBeOnDay = (habit: typeof userHabitsInPlan[0], date: Date): boolean => {
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'weekly' && habit.frequencyDays) {
        const dayName = getDayName(date)
        const frequencyDays = habit.frequencyDays as string[]
        return frequencyDays.includes(dayName)
      }
      return true
    }

    // Calculate weekly stats (up to today)
    let totalExpectedThisWeek = 0
    let tasksCompletedThisWeek = 0
    const weeklyDataMap: Record<number, { completed: number; expected: number }> = {
      0: { completed: 0, expected: 0 }, // Monday
      1: { completed: 0, expected: 0 }, // Tuesday
      2: { completed: 0, expected: 0 }, // Wednesday
      3: { completed: 0, expected: 0 }, // Thursday
      4: { completed: 0, expected: 0 }, // Friday
      5: { completed: 0, expected: 0 }, // Saturday
      6: { completed: 0, expected: 0 }, // Sunday
    }

    for (let i = 0; i <= 6; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      // Only count days up to today
      if (dateStr > today) continue

      for (const habit of userHabitsInPlan) {
        if (shouldHabitBeOnDay(habit, date)) {
          weeklyDataMap[i].expected++
          totalExpectedThisWeek++

          const isCompleted = weeklyLogs.some(
            log => log.habitId === habit.habitId && log.date === dateStr
          )
          if (isCompleted) {
            weeklyDataMap[i].completed++
            tasksCompletedThisWeek++
          }
        }
      }
    }

    // Calculate weekly completion percentage
    const weeklyCompletion = totalExpectedThisWeek > 0
      ? Math.round((tasksCompletedThisWeek / totalExpectedThisWeek) * 100)
      : 0

    // Calculate weekly data for chart (completion percentage per day)
    const weeklyData = Object.values(weeklyDataMap).map(day =>
      day.expected > 0 ? Math.round((day.completed / day.expected) * 100) : 0
    )

    // Find best day of the week
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    let bestDayIndex = 0
    let bestDayPercentage = 0

    for (let i = 0; i < 7; i++) {
      const dayData = weeklyDataMap[i]
      const percentage = dayData.expected > 0
        ? Math.round((dayData.completed / dayData.expected) * 100)
        : 0
      if (percentage > bestDayPercentage) {
        bestDayPercentage = percentage
        bestDayIndex = i
      }
    }

    // Today's stats
    let totalTasksToday = 0
    let tasksCompletedToday = 0
    const todayDate = new Date(today)

    for (const habit of userHabitsInPlan) {
      if (shouldHabitBeOnDay(habit, todayDate)) {
        totalTasksToday++
        const isCompleted = weeklyLogs.some(
          log => log.habitId === habit.habitId && log.date === today
        )
        if (isCompleted) {
          tasksCompletedToday++
        }
      }
    }

    // Get monthly logs
    const monthlyLogs = await db
      .select({
        habitId: habitLogs.habitId,
        date: habitLogs.date,
        completed: habitLogs.completed,
      })
      .from(habitLogs)
      .where(
        and(
          sql`${habitLogs.habitId} IN (${sql.join(habitIds.map(id => sql`${id}::uuid`), sql`, `)})`,
          gte(habitLogs.date, monthStartStr),
          lte(habitLogs.date, monthEndStr),
          eq(habitLogs.completed, true)
        )
      )

    // Calculate monthly stats (up to today)
    let totalExpectedThisMonth = 0
    let tasksCompletedThisMonth = 0
    const daysInMonth = monthEnd.getDate()
    const currentDayOfMonth = Math.min(now.getDate(), daysInMonth)
    const activeDaysSet = new Set<string>()

    for (let day = 1; day <= currentDayOfMonth; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day)
      const dateStr = date.toISOString().split('T')[0]

      for (const habit of userHabitsInPlan) {
        if (shouldHabitBeOnDay(habit, date)) {
          totalExpectedThisMonth++

          const isCompleted = monthlyLogs.some(
            log => log.habitId === habit.habitId && log.date === dateStr
          )
          if (isCompleted) {
            tasksCompletedThisMonth++
            activeDaysSet.add(dateStr)
          }
        }
      }
    }

    const monthlyCompletion = totalExpectedThisMonth > 0
      ? Math.round((tasksCompletedThisMonth / totalExpectedThisMonth) * 100)
      : 0

    // Check-ins is total completed this month
    const checkIns = monthlyLogs.length

    // Active days is number of unique days with at least one completion
    const activeDays = activeDaysSet.size

    // Calculate best streak
    let bestStreak = 0
    let currentStreak = 0

    // Get all dates in month sorted
    const sortedDates = Array.from(activeDaysSet).sort()

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1
      } else {
        const prevDate = new Date(sortedDates[i - 1])
        const currDate = new Date(sortedDates[i])
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      }
      bestStreak = Math.max(bestStreak, currentStreak)
    }

    // Calculate monthly score (completion percentage + streak bonus)
    const streakBonus = Math.min(bestStreak * 2, 20) // Max 20 points from streak
    const monthlyScore = Math.min(Math.round(monthlyCompletion * 0.8 + streakBonus), 100)

    // Calculate completion ratio
    const completionRatio = totalExpectedThisMonth > 0
      ? Number((tasksCompletedThisMonth / totalExpectedThisMonth).toFixed(2))
      : 0

    // Get heatmap data (last 35 days)
    const heatmapLogs = await db
      .select({
        habitId: habitLogs.habitId,
        date: habitLogs.date,
        completed: habitLogs.completed,
      })
      .from(habitLogs)
      .where(
        and(
          sql`${habitLogs.habitId} IN (${sql.join(habitIds.map(id => sql`${id}::uuid`), sql`, `)})`,
          gte(habitLogs.date, heatmapStartStr),
          lte(habitLogs.date, today),
          eq(habitLogs.completed, true)
        )
      )

    const heatmapData: { date: string; percentage: number }[] = []

    for (let i = 0; i < 35; i++) {
      const date = new Date(heatmapStart)
      date.setDate(heatmapStart.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      if (dateStr > today) {
        heatmapData.push({ date: dateStr, percentage: 0 })
        continue
      }

      let expectedOnDay = 0
      let completedOnDay = 0

      for (const habit of userHabitsInPlan) {
        if (shouldHabitBeOnDay(habit, date)) {
          expectedOnDay++
          const isCompleted = heatmapLogs.some(
            log => log.habitId === habit.habitId && log.date === dateStr
          )
          if (isCompleted) {
            completedOnDay++
          }
        }
      }

      const percentage = expectedOnDay > 0
        ? Math.round((completedOnDay / expectedOnDay) * 100)
        : 0

      heatmapData.push({ date: dateStr, percentage })
    }

    return NextResponse.json({
      weeklyCompletion,
      monthlyScore,
      completionRatio,
      tasksCompletedThisWeek,
      totalTasksThisWeek: totalExpectedThisWeek,
      tasksCompletedToday,
      totalTasksToday,
      bestDay: { day: dayNames[bestDayIndex], percentage: bestDayPercentage },
      monthlyCompletion,
      checkIns,
      activeDays,
      bestStreak,
      heatmapData,
      weeklyData,
      habitsInPlan: totalHabitsInPlan,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
