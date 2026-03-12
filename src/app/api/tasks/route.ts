import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { tasks } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { and, eq, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

// GET /api/tasks?week=2026-03-02
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('week')

    if (!weekStart) {
      return NextResponse.json({ error: 'week parameter is required' }, { status: 400 })
    }

    // Calculate week end (6 days after week start)
    const startDate = new Date(weekStart)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)

    const weekTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, user.id),
          gte(tasks.date, weekStart),
          lte(tasks.date, endDate.toISOString().split('T')[0])
        )
      )
      .orderBy(tasks.sortOrder, tasks.createdAt)

    return NextResponse.json(weekTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/tasks
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.string().default('daily'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createTaskSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, date, type } = validation.data

    // Get the next sort order for this date
    const existingTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), eq(tasks.date, date)))

    const maxSortOrder = existingTasks.reduce(
      (max, task) => Math.max(max, task.sortOrder),
      -1
    )

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.id,
        title,
        date,
        type,
        sortOrder: maxSortOrder + 1,
        completed: false,
      })
      .returning()

    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
