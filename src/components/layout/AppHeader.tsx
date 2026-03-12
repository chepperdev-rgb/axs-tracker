'use client'

import { useState, useEffect } from 'react'
import { Logo } from './Logo'
import { NavTabs } from './NavTabs'
import { UserMenu } from './UserMenu'
import { Globe, Menu, X, Check, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/providers/i18n-provider'
import { usePaymentModalContext } from '@/providers/payment-modal-provider'
import { Locale, languageNames, locales } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const { locale, setLocale } = useI18n()
  const { openModal } = usePaymentModalContext()

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
      <div className="container mx-auto px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavTabs />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Premium Button */}
            <Button
              variant="luxury"
              size="sm"
              onClick={openModal}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm gold-pulse"
            >
              <Crown className="w-4 h-4" />
              <span>Premium</span>
            </Button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-luxury rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
                >
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{locale.toUpperCase()}</span>
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

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden btn-glass rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#d4af37]" />
              ) : (
                <Menu className="w-5 h-5 text-[#d4af37]" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a0a0a] border border-[rgba(212,175,55,0.3)] border-t-0 rounded-b-2xl mx-2 mb-2 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <NavTabs mobile onItemClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  )
}
