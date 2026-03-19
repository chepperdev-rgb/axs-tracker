import { db } from '@/db'
import { habits, monthlyPlans } from '@/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_HABITS = [
  { name: 'Workout / Activity', emoji: '🏋️', category: 'health', frequency: 'daily', translationKey: 'workout' },
  { name: 'Contrast Shower / Cold Exposure', emoji: '🚿', category: 'health', frequency: 'daily', translationKey: 'coldShower' },
  { name: 'Reading / Learning (30 min)', emoji: '📚', category: 'growth', frequency: 'daily', translationKey: 'reading' },
  { name: 'Evening Day Planning', emoji: '📝', category: 'productivity', frequency: 'daily', translationKey: 'planning' },
  { name: 'Sleep Norm (7-8 hours)', emoji: '😴', category: 'health', frequency: 'daily', translationKey: 'sleep' },
  { name: 'Wake Up at 5:00', emoji: '⏰', category: 'productivity', frequency: 'daily', translationKey: 'wakeUp' },
] as const

/**
 * Seeds default habits for a newly registered user.
 * Only runs if user has zero habits (first time).
 * Wrapped in try/catch to handle race conditions gracefully.
 */
export async function seedDefaultHabits(userId: string) {
  try {
    const existing = await db
      .select({ id: habits.id })
      .from(habits)
      .where(eq(habits.userId, userId))
      .limit(1)

    if (existing.length > 0) return

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const inserted = await db
      .insert(habits)
      .values(
        DEFAULT_HABITS.map((h, i) => ({
          userId,
          name: h.name,
          emoji: h.emoji,
          category: h.category,
          frequency: h.frequency,
          translationKey: h.translationKey,
          sortOrder: i,
        }))
      )
      .returning({ id: habits.id })

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
  } catch {
    // Race condition: another request already seeded. Silently ignore.
  }
}
