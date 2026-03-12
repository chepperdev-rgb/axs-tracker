import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import es from '@/locales/es.json'
import uk from '@/locales/uk.json'

export const locales = ['en', 'ru', 'es', 'uk'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const messages = {
  en,
  ru,
  es,
  uk,
} as const

export type Messages = typeof en

export const languageNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  es: 'Espanol',
  uk: 'Українська',
}

export function getMessages(locale: Locale): Messages {
  return messages[locale] || messages[defaultLocale]
}
