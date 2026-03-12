'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'monthly', label: 'Monthly', href: '/monthly' },
  { id: 'habits', label: 'Habits', href: '/habits' },
  { id: 'planner', label: 'Planner', href: '/planner' },
]

export function NavTabs() {
  const pathname = usePathname()

  const getActiveTab = () => {
    const tab = tabs.find((t) => pathname.startsWith(t.href))
    return tab?.id || 'dashboard'
  }

  const activeTab = getActiveTab()

  return (
    <nav className="flex items-center gap-1 p-1 bg-[#141414] rounded-full border border-[#2a2a2a]">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`
            px-5 py-2
            rounded-full
            text-sm font-medium
            transition-all duration-200
            ${
              activeTab === tab.id
                ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]'
            }
          `}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
