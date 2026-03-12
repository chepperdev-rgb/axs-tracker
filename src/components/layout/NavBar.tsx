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

export function NavBar() {
  const pathname = usePathname()
  const t = useTranslations()

  const getActiveTab = () => {
    const tab = tabConfig.find((tab) => pathname.startsWith(tab.href))
    return tab?.id || 'dashboard'
  }

  const activeTab = getActiveTab()

  return (
    <nav className="sticky top-14 sm:top-16 z-40 w-full bg-[#0f0f0f] border-b border-[rgba(212,175,55,0.1)]">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-center py-2">
          {/* Full width pill container */}
          <div className="flex items-center w-full max-w-2xl gap-1 p-1 bg-[#1a1a1a] rounded-full border border-[rgba(212,175,55,0.15)]">
            {tabConfig.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`
                  flex-1 text-center
                  px-2 sm:px-4 py-2 sm:py-2.5
                  rounded-full
                  text-xs sm:text-sm font-medium
                  transition-all duration-200
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
          </div>
        </div>
      </div>
    </nav>
  )
}
