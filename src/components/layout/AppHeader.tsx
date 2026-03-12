'use client'

import { useState, useEffect } from 'react'
import { Logo } from './Logo'
import { NavTabs } from './NavTabs'
import { UserMenu } from './UserMenu'
import { Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/providers/i18n-provider'
import { Locale, languageNames, locales } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function AppHeader() {
  const [user, setUser] = useState<User | null>(null)
  const { locale, setLocale } = useI18n()

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale)
  }

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-[rgba(212,175,55,0.2)]">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Logo />

          {/* Navigation - Always visible, centered */}
          <div className="flex-1 flex justify-center">
            <NavTabs />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-luxury rounded-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm min-w-[50px] sm:min-w-[70px]"
                >
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="ml-1 font-medium">{locale.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass-card rounded-xl p-2 min-w-[140px]"
              >
                {locales.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className="px-3 py-2 rounded-lg text-[#a0a0a0] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <span>{languageNames[lang]}</span>
                    {locale === lang && (
                      <Check className="w-4 h-4 text-[#d4af37]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {user && <UserMenu user={user} />}
          </div>
        </div>
      </div>
    </header>
  )
}
