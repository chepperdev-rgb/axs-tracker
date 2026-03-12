'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Target, ClipboardList, LayoutDashboard } from 'lucide-react'
import { useTranslations } from '@/providers/i18n-provider'

const navItems = [
  { id: 'dashboard', key: 'dashboard' as const, href: '/dashboard', icon: LayoutDashboard },
  { id: 'monthly', key: 'monthly' as const, href: '/monthly', icon: Calendar },
  { id: 'habits', key: 'habits' as const, href: '/habits', icon: Target },
  { id: 'planner', key: 'planner' as const, href: '/planner', icon: ClipboardList },
]

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations()

  const getActiveTab = () => {
    const tab = navItems.find((item) => pathname.startsWith(item.href))
    return tab?.id || 'dashboard'
  }

  const activeTab = getActiveTab()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Background with blur */}
      <div className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[rgba(212,175,55,0.2)]" />

      {/* Nav container */}
      <div className="relative flex items-center justify-center px-3 py-2">
        {/* Pill-shaped container */}
        <div className="flex items-center gap-1 p-1.5 bg-[#1a1a1a] rounded-full border border-[rgba(212,175,55,0.15)] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex items-center gap-1.5
                  px-3 py-2
                  rounded-full
                  text-xs font-medium
                  transition-all duration-300
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-[#0a0a0a] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'text-[#808080] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)]'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? '' : ''}`} />
                <span className={`${isActive ? '' : 'hidden sm:inline'}`}>
                  {t.nav[item.key]}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
