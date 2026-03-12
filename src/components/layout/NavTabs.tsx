'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Target, ClipboardList } from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'monthly', label: 'Monthly', href: '/monthly', icon: Calendar },
  { id: 'habits', label: 'Habits', href: '/habits', icon: Target },
  { id: 'planner', label: 'Planner', href: '/planner', icon: ClipboardList },
]

interface NavTabsProps {
  mobile?: boolean
  onItemClick?: () => void
}

export function NavTabs({ mobile = false, onItemClick }: NavTabsProps) {
  const pathname = usePathname()

  const getActiveTab = () => {
    const tab = tabs.find((t) => pathname.startsWith(t.href))
    return tab?.id || 'dashboard'
  }

  const activeTab = getActiveTab()

  if (mobile) {
    return (
      <nav className="flex flex-col p-2">
        {tabs.map((tab) => {
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
              {tab.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="flex items-center gap-1 p-1 glass-card rounded-full">
      {tabs.map((tab) => (
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
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
