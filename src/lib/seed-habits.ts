import { db } from '@/db'
import { habits, users, monthlyPlans } from '@/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_HABITS = [
  { name: 'Тренировка / Активность', emoji: '🏋️', category: 'health', frequency: 'daily' },
  { name: 'Контрастный душ / Закаливание', emoji: '🚿', category: 'health', frequency: 'daily' },
  { name: 'Чтение / Обучение (30 минут)', emoji: '📚', category: 'growth', frequency: 'daily' },
  { name: 'Планирование дня с вечера', emoji: '📝', category: 'productivity', frequency: 'daily' },
  { name: 'Норма сна (7-8 часов)', emoji: '😴', category: 'health', frequency: 'daily' },
  { name: 'Подъём в 5:00', emoji: '⏰', category: 'productivity', frequency: 'daily' },
] as const

/**
 * Seeds default habits for a newly registered user.
 * Only runs if user has zero habits (first time).
 * Also adds all habits to the current month plan.
 */
export async function seedDefaultHabits(userId: string) {
  // Check if user already has habits
  const existing = await db
    .select({ id: habits.id })
    .from(habits)
    .where(eq(habits.userId, userId))
    .limit(1)

  if (existing.length > 0) return

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Insert all default habits
  const inserted = await db
    .insert(habits)
    .values(
      DEFAULT_HABITS.map((h, i) => ({
        userId,
        name: h.name,
        emoji: h.emoji,
        category: h.category,
        frequency: h.frequency,
        sortOrder: i,
      }))
    )
    .returning({ id: habits.id })

  // Add all to current month plan
  if (inserted.length > 0) {
    await db
      .insert(monthlyPlans)
      .values(
        inserted.map(h => ({
          userId,
          habitId: h.id,
          year,
          month,
        }))
      )
      .onConflictDoNothing()
  }
}
