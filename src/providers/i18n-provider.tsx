'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Locale, defaultLocale, getMessages, locales, Messages } from '@/lib/i18n'

const STORAGE_KEY = 'axs-tracker-locale'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Messages
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load saved locale from localStorage on mount
    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale)
    }
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
    // Update the html lang attribute
    document.documentElement.lang = newLocale
  }, [])

  const t = getMessages(locale)

  // Update html lang on locale change
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale
    }
  }, [locale, mounted])

  // Prevent hydration mismatch by using default locale until mounted
  const value: I18nContextType = {
    locale: mounted ? locale : defaultLocale,
    setLocale,
    t: mounted ? t : getMessages(defaultLocale),
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Helper hook for accessing translations with type safety
export function useTranslations() {
  const { t } = useI18n()
  return t
}
