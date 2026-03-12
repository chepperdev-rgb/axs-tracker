'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from '@/providers/i18n-provider'

const tabConfig = [
  { id: 'dashboard', key: 'dashboard' as const, href: '/dashboard' },
  { id: 'monthly', key: 'monthly' as const, href: '/monthly' },
  { id: 'habits', key: 'habits' as const, href: '/habits' },
  { id: 'planner', key: 'planner' as const, href: '/planner' },
]

export function NavTabs() {
  const pathname = usePathname()
  const t = useTranslations()

  const getActiveTab = () => {
    const tab = tabConfig.find((tab) => pathname.startsWith(tab.href))
    return tab?.id || 'dashboard'
  }

  const activeTab = getActiveTab()

  return (
    <nav className="flex items-center gap-0.5 sm:gap-1 p-1 bg-[#1a1a1a] rounded-full border border-[rgba(212,175,55,0.15)]">
      {tabConfig.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`
            px-2.5 sm:px-4 lg:px-5 py-1.5 sm:py-2
            rounded-full
            text-[11px] sm:text-sm font-medium
            transition-all duration-200
            whitespace-nowrap
            ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-[#0a0a0a] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-[#808080] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.05)]'
            }
          `}
        >
          {t.nav[tab.key]}
        </Link>
      ))}
    </nav>
  )
}
