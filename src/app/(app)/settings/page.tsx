'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/providers/i18n-provider'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Globe, Bell, Moon, Shield, Smartphone, Clock,
  Eye, Volume2, Vibrate, Download, HelpCircle,
  ChevronRight, Crown, Star, Infinity, Loader2,
  User, Calendar, CreditCard, Footprints,
  CheckCircle2, ExternalLink, RefreshCw,
} from 'lucide-react'

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const [userEmail, setUserEmail] = useState('')
  const [userPlan, setUserPlan] = useState('free')
  const [subscriptionStatus, setSubscriptionStatus] = useState('none')
  const [portalLoading, setPortalLoading] = useState(false)
  const [createdAt, setCreatedAt] = useState('')

  // Shortcuts integration state
  const [shortcutsUrl, setShortcutsUrl] = useState<string | null>(null)
  const [shortcutsLoading, setShortcutsLoading] = useState(false)

  // Notification settings (local state)
  const [dailyReminder, setDailyReminder] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [sound, setSound] = useState(true)
  const [vibration, setVibration] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [compactView, setCompactView] = useState(false)
  const [showStreak, setShowStreak] = useState(true)
  const [autoArchive, setAutoArchive] = useState(false)
  const [weekStartMonday, setWeekStartMonday] = useState(true)
  const [showPercentages, setShowPercentages] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        setCreatedAt(new Date(user.created_at).toLocaleDateString())
      }
      // Get plan
      const res = await fetch('/api/user/plan')
      if (res.ok) {
        const data = await res.json()
        setUserPlan(data.plan)
        setSubscriptionStatus(data.subscriptionStatus)
      }
    }
    loadUser()

    // Check if health is already connected
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/user/shortcuts-url')
        if (res.ok) {
          const data = await res.json()
          if (data.url) setShortcutsUrl(data.url)
        }
      } catch {}
    }
    checkHealth()
  }, [])

  const handleConnectHealth = async () => {
    setShortcutsLoading(true)
    try {
      const res = await fetch('/api/user/shortcuts-url')
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          window.open(data.url, '_blank')
          setShortcutsUrl(data.url)
        }
      } else {
        toast.error('Failed to get Shortcut link')
      }
    } catch {
      toast.error('Failed to connect')
    } finally {
      setShortcutsLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Could not open billing portal')
      }
    } catch {
      toast.error('Error opening billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const PlanBadge = () => {
    if (userPlan === 'lifetime') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-[#0a0a0a] text-xs font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]">
          <Infinity className="w-3.5 h-3.5" />
          LIFETIME
        </div>
      )
    }
    if (userPlan === 'diamond') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-[#0a0a0a] text-xs font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]">
          <Star className="w-3.5 h-3.5" />
          DIAMOND
        </div>
      )
    }
    if (userPlan === 'premium') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4af37] text-[#d4af37] text-xs font-bold">
          <Crown className="w-3.5 h-3.5" />
          PREMIUM
          {subscriptionStatus === 'trialing' && (
            <span className="text-[9px] opacity-70">TRIAL</span>
          )}
        </div>
      )
    }
    return null
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        value ? 'bg-[#d4af37]' : 'bg-[#2a2a2a]'
      }`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        value ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`} />
    </button>
  )

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
          Settings
        </h1>
        <p className="text-base sm:text-lg text-gold-gradient mt-1">Preferences & Account</p>
      </div>

      {/* Profile Card */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Profile</h3>
          <PlanBadge />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(0,0,0,0.2)]">
            <User className="w-4 h-4 text-[#707070]" />
            <div className="flex-1">
              <p className="text-xs text-[#707070]">Email</p>
              <p className="text-sm text-[#f5f5f5]">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(0,0,0,0.2)]">
            <Calendar className="w-4 h-4 text-[#707070]" />
            <div className="flex-1">
              <p className="text-xs text-[#707070]">Member since</p>
              <p className="text-sm text-[#f5f5f5]">{createdAt}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Health Integration */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <Footprints className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Health Integration</h3>
        </div>
        <p className="text-xs text-[#707070] mb-4">
          Sync steps from iPhone Health automatically via Shortcuts.
        </p>

        {shortcutsUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)]">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-[#f5f5f5]">Connected to Apple Health</p>
                <p className="text-xs text-[#707070]">Steps sync via Shortcuts</p>
              </div>
            </div>
            <button
              onClick={handleConnectHealth}
              disabled={shortcutsLoading}
              className="flex items-center gap-2 text-xs text-[#505050] hover:text-[#707070] transition-colors disabled:opacity-50"
            >
              {shortcutsLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Reconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectHealth}
            disabled={shortcutsLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-[rgba(212,175,55,0.15)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.25)] transition-colors border border-[rgba(212,175,55,0.2)] disabled:opacity-50"
          >
            {shortcutsLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Footprints className="w-3.5 h-3.5" />
            )}
            Connect Apple Health
            <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
          </button>
        )}

        {/* How it works */}
        <div className="mt-4 pt-3 border-t border-[rgba(212,175,55,0.1)]">
          <p className="text-[10px] text-[#707070] uppercase tracking-wider mb-3">How it works</p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#d4af37]">1</span>
              </div>
              <p className="text-xs text-[#a0a0a0] pt-0.5">Tap &quot;Connect Apple Health&quot;</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#d4af37]">2</span>
              </div>
              <p className="text-xs text-[#a0a0a0] pt-0.5">Install the Shortcut on your iPhone</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#d4af37]">3</span>
              </div>
              <p className="text-xs text-[#a0a0a0] pt-0.5">Done — steps sync automatically</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Language */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Language</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['en', 'ru', 'es', 'uk'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLocale(lang)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                locale === lang
                  ? 'bg-[rgba(212,175,55,0.15)] border-[#d4af37] text-[#d4af37]'
                  : 'border-[#2a2a2a] text-[#707070] hover:border-[#3a3a3a]'
              }`}
            >
              {t.languages[lang]}
            </button>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#f5f5f5]">Daily reminder</p>
              <p className="text-xs text-[#505050]">Remind to log habits</p>
            </div>
            <Toggle value={dailyReminder} onChange={setDailyReminder} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#f5f5f5]">Weekly report</p>
              <p className="text-xs text-[#505050]">Summary every Sunday</p>
            </div>
            <Toggle value={weeklyReport} onChange={setWeeklyReport} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-[#505050]" />
              <p className="text-sm text-[#f5f5f5]">Sound effects</p>
            </div>
            <Toggle value={sound} onChange={setSound} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="w-3.5 h-3.5 text-[#505050]" />
              <p className="text-sm text-[#f5f5f5]">Vibration</p>
            </div>
            <Toggle value={vibration} onChange={setVibration} />
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <Moon className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Appearance</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#f5f5f5]">Dark mode</p>
            <Toggle value={darkMode} onChange={setDarkMode} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#f5f5f5]">Compact view</p>
            <Toggle value={compactView} onChange={setCompactView} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#f5f5f5]">Show streak badges</p>
            <Toggle value={showStreak} onChange={setShowStreak} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#f5f5f5]">Show percentages</p>
            <Toggle value={showPercentages} onChange={setShowPercentages} />
          </div>
        </div>
      </Card>

      {/* Habits */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Habits & Data</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#f5f5f5]">Week starts on Monday</p>
              <p className="text-xs text-[#505050]">Change first day of week</p>
            </div>
            <Toggle value={weekStartMonday} onChange={setWeekStartMonday} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#f5f5f5]">Auto-archive inactive</p>
              <p className="text-xs text-[#505050]">Archive after 30 days unused</p>
            </div>
            <Toggle value={autoArchive} onChange={setAutoArchive} />
          </div>
          <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#505050]" />
              <p className="text-sm text-[#f5f5f5]">Export data</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#3a3a3a]" />
          </button>
        </div>
      </Card>

      {/* Privacy & Security */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Privacy & Security</h3>
        </div>
        <div className="space-y-1">
          <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#505050]" />
              <p className="text-sm text-[#f5f5f5]">Privacy policy</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#3a3a3a]" />
          </button>
          <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#505050]" />
              <p className="text-sm text-[#f5f5f5]">Terms of service</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#3a3a3a]" />
          </button>
        </div>
      </Card>

      {/* Help & Support */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0]">Help & Support</h3>
        </div>
        <div className="space-y-1">
          <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors">
            <p className="text-sm text-[#f5f5f5]">FAQ</p>
            <ChevronRight className="w-4 h-4 text-[#3a3a3a]" />
          </button>
          <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors">
            <p className="text-sm text-[#f5f5f5]">Contact support</p>
            <ChevronRight className="w-4 h-4 text-[#3a3a3a]" />
          </button>
          <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors">
            <p className="text-sm text-[#f5f5f5]">Report a bug</p>
            <ChevronRight className="w-4 h-4 text-[#3a3a3a]" />
          </button>
        </div>
      </Card>

      {/* About — subscription management buried here */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-4 h-4 text-[#505050]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#505050]">About</h3>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between p-3">
            <p className="text-sm text-[#505050]">Version</p>
            <p className="text-xs text-[#3a3a3a]">1.0.0</p>
          </div>
          <div className="flex items-center justify-between p-3">
            <p className="text-sm text-[#505050]">Build</p>
            <p className="text-xs text-[#3a3a3a]">2026.03.18</p>
          </div>
          {(userPlan !== 'free') && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-[#3a3a3a]" />
                <p className="text-xs text-[#3a3a3a]">Manage subscription</p>
              </div>
              {portalLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#3a3a3a]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#2a2a2a]" />
              )}
            </button>
          )}
        </div>
      </Card>

      {/* Logout */}
      <div className="pb-8">
        <Button
          variant="ghost"
          className="w-full text-[#e74c3c] hover:bg-[rgba(231,76,60,0.1)] h-12"
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}
