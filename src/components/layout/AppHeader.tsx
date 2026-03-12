'use client'

import { Logo } from './Logo'
import { NavTabs } from './NavTabs'
import { Globe } from 'lucide-react'
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
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Navigation */}
          <NavTabs />

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-[#d4af37] text-black border-0 hover:bg-[#f0d060] px-4 py-2 rounded-full flex items-center gap-2 font-semibold"
              >
                <Globe className="w-4 h-4" />
                <span>EN</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-2 min-w-[140px]"
            >
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  className="px-3 py-2 rounded-lg text-[#a0a0a0] hover:text-[#d4af37] hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
