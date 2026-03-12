'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Target, ClipboardList } from 'lucide-react'
import { useTranslations } from '@/providers/i18n-provider'

const tabConfig = [
  { id: 'dashboard', key: 'dashboard' as const, href: '/dashboard', icon: LayoutDashboard },
  { id: 'monthly', key: 'monthly' as const, href: '/monthly', icon: Calendar },
  { id: 'habits', key: 'habits' as const, href: '/habits', icon: Target },
  { id: 'planner', key: 'planner' as const, href: '/planner', icon: ClipboardList },
]

interface NavTabsProps {
  mobile?: boolean
  onItemClick?: () => void
}

export function NavTabs({ mobile = false, onItemClick }: NavTabsProps) {
  const pathname = usePathname()
  const t = useTranslations()

  const getActiveTab = () => {
    const tab = tabConfig.find((tab) => pathname.startsWith(tab.href))
    return tab?.id || 'dashboard'
  }

  const activeTab = getActiveTab()

  if (mobile) {
    return (
      <nav className="flex flex-col p-2">
        {tabConfig.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={onItemClick}
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                text-base font-medium
                transition-all duration-200
                ${
                  activeTab === tab.id
                    ? 'bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]'
                    : 'text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.05)]'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'gold-glow' : ''}`} />
              {t.nav[tab.key]}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="flex items-center gap-1 p-1 glass-card rounded-full">
      {tabConfig.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`
            px-4 lg:px-5 py-2
            rounded-full
            text-sm font-medium
            transition-all duration-200
            ${
              activeTab === tab.id
                ? 'btn-luxury text-black'
                : 'text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.05)]'
            }
          `}
        >
          {t.nav[tab.key]}
        </Link>
      ))}
    </nav>
  )
}
