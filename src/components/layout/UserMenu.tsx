'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings } from 'lucide-react'
import { toast } from 'sonner'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserMenuProps {
  user: SupabaseUser
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error('Failed to sign out')
      return
    }

    toast.success('Signed out successfully')
    router.push('/login')
    router.refresh()
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full border border-[#d4af37]/30 bg-[#1c1c1c] hover:border-[#d4af37] hover:bg-[#1c1c1c] transition-all"
        >
          <span className="text-sm font-semibold text-[#d4af37]">{initials}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-card rounded-xl p-2 min-w-[200px]"
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-[#f5f5f5]">{displayName}</p>
          <p className="text-xs text-[#a0a0a0]">{user.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-[#2a2a2a]" />
        <DropdownMenuItem
          className="px-3 py-2 rounded-lg text-[#a0a0a0] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] cursor-pointer transition-colors"
          onClick={() => router.push('/settings')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="px-3 py-2 rounded-lg text-[#a0a0a0] hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Wrapper component that fetches user on mount
export function UserMenuClient() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error('Failed to sign out')
      return
    }

    toast.success('Signed out successfully')
    router.push('/login')
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="btn-glass rounded-lg text-[#d4af37] hover:text-[#f0d060]"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline ml-2">Sign out</span>
    </Button>
  )
}
