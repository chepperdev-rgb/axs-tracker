'use client'

import { useState } from 'react'
import { Logo } from './Logo'
import { NavTabs } from './NavTabs'
import { Globe, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'es', label: 'Español' },
  { code: 'uk', label: 'Українська' },
]

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-luxury rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
                >
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">EN</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass-card rounded-xl p-2 min-w-[140px]"
              >
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    className="px-3 py-2 rounded-lg text-[#a0a0a0] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] cursor-pointer transition-colors"
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
        <div className="md:hidden absolute top-full left-0 right-0 glass-card border-t-0 rounded-b-2xl mx-2 mb-2 overflow-hidden">
          <NavTabs mobile onItemClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  )
}
