import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { tasks } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { hasPaidPlan } from '@/lib/check-plan'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

const rolloverSchema = z.object({
  taskId: z.string().uuid(),
  action: z.enum(['postpone', 'cancel', 'complete']),
  tomorrowDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await hasPaidPlan(user.id))) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }

    const body = await request.json()
    const validation = rolloverSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { taskId, action, tomorrowDate } = validation.data

    // Verify task belongs to user
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Prevent double-processing
    if (existingTask.rolloverProcessedAt) {
      return NextResponse.json({ error: 'Task already processed' }, { status: 409 })
    }

    const now = new Date()

    if (action === 'postpone') {
      if (!tomorrowDate) {
        return NextResponse.json({ error: 'tomorrowDate is required for postpone action' }, { status: 400 })
      }

      // Get next sort order for target date
      const existingForDate = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.userId, user.id), eq(tasks.date, tomorrowDate)))

      const maxSortOrder = existingForDate.reduce(
        (max, task) => Math.max(max, task.sortOrder),
        -1
      )

      // Atomic transaction: mark old as rolled_over + create new task
      // The isNull guard inside the transaction prevents TOCTOU race conditions
      const result = await db.transaction(async (tx) => {
        const [updatedTask] = await tx
          .update(tasks)
          .set({
            status: 'rolled_over',
            rolloverProcessedAt: now,
          })
          .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id), isNull(tasks.rolloverProcessedAt)))
          .returning()

        if (!updatedTask) {
          throw new Error('Task already processed (concurrent request)')
        }

        const [newTask] = await tx
          .insert(tasks)
          .values({
            userId: user.id,
            title: existingTask.title,
            date: tomorrowDate,
            type: existingTask.type,
            status: 'active',
            parentTaskId: taskId,
            sortOrder: maxSortOrder + 1,
            completed: false,
          })
          .returning()

        return { updatedTask, newTask }
      })

      return NextResponse.json(result)
    }

    if (action === 'cancel') {
      const [updatedTask] = await db
        .update(tasks)
        .set({
          status: 'cancelled',
          rolloverProcessedAt: now,
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id), isNull(tasks.rolloverProcessedAt)))
        .returning()

      if (!updatedTask) {
        return NextResponse.json({ error: 'Task already processed' }, { status: 409 })
      }

      return NextResponse.json(updatedTask)
    }

    if (action === 'complete') {
      const [updatedTask] = await db
        .update(tasks)
        .set({
          completed: true,
          status: 'completed',
          rolloverProcessedAt: now,
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id), isNull(tasks.rolloverProcessedAt)))
        .returning()

      if (!updatedTask) {
        return NextResponse.json({ error: 'Task already processed' }, { status: 409 })
      }

      return NextResponse.json(updatedTask)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('already processed')) {
      return NextResponse.json({ error: 'Task already processed' }, { status: 409 })
    }
    console.error('Error processing rollover:', error)
    return NextResponse.json({ error: 'Failed to process rollover' }, { status: 500 })
  }
}
