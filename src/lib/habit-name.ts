import type { Messages } from '@/lib/i18n'

interface HabitLike {
  name: string
  translationKey?: string | null
  translations?: Record<string, string> | unknown
}

/**
 * Get the display name for a habit based on current locale.
 * Priority:
 * 1. translationKey → t.seedHabits[key] (preset habits, fully translated)
 * 2. translations[locale] (user habits with per-locale names)
 * 3. name (fallback — original name)
 */
export function getHabitName(habit: HabitLike, locale: string, t: Messages): string {
  // Preset habit with translation key
  if (habit.translationKey) {
    const seedHabits = t.seedHabits as Record<string, string>
    if (seedHabits[habit.translationKey]) {
      return seedHabits[habit.translationKey]
    }
  }

  // User habit with per-locale translations
  if (habit.translations && typeof habit.translations === 'object') {
    const translations = habit.translations as Record<string, string>
    if (translations[locale]) {
      return translations[locale]
    }
  }

  // Fallback to raw name
  return habit.name
}
