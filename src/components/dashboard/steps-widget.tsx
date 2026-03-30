'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { useStepsData } from '@/hooks/useStepsData'
import { Footprints, RefreshCw } from 'lucide-react'

interface StepsWidgetProps {
  date: string // YYYY-MM-DD
  goal?: number
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function StepsWidget({ date, goal = 10_000 }: StepsWidgetProps) {
  const { steps, syncedAt, isLoading, isFetching, refetch } = useStepsData(date)
  const router = useRouter()

  const progress = steps ? Math.min((steps / goal) * 100, 100) : 0

  // Semi-circle arc (speedometer style)
  // ViewBox: 0 0 200 120 — wide, only top half visible
  const cx = 100
  const cy = 108
  const r = 88
  const strokeW = 14
  // Arc spans 180° — from 180° to 0° (left to right, top)
  const totalAngle = 180
  const arcLength = (Math.PI * r) // half circumference
  const filled = (progress / 100) * arcLength
  const gap = arcLength - filled

  // SVG arc path for semicircle
  const startAngle = Math.PI // left
  const endAngle = 0         // right

  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)

  const handleConnect = () => {
    router.push('/settings')
  }

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <Footprints className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            Daily Steps
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse bg-[#2a2a2a] rounded-full w-32 h-16" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-[#d4af37]" />
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
              Daily Steps
            </h3>
          </div>
          {/* Connect button — always visible */}
          <button
            onClick={handleConnect}
            className="px-3 py-1 text-[11px] font-bold rounded-lg bg-[#d4af37] text-[#0a0a0a] hover:bg-[#f0d060] transition-colors shadow-[0_0_12px_rgba(212,175,55,0.4)]"
          >
            Connect
          </button>
        </div>

        {/* Arc gauge */}
        <div className="flex flex-col items-center mt-1">
          <div className="relative w-full" style={{ maxWidth: 220 }}>
            <svg viewBox="0 0 200 112" className="w-full overflow-visible">
              <defs>
                <linearGradient id="arcGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8a6a2a" />
                  <stop offset="50%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#f0d060" />
                </linearGradient>
              </defs>

              {/* Background arc */}
              <path
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke="#2a2a2a"
                strokeWidth={strokeW}
                strokeLinecap="round"
              />

              {/* Progress arc */}
              {progress > 0 && (
                <path
                  d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                  fill="none"
                  stroke="url(#arcGold)"
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeDasharray={`${filled} ${gap + 1}`}
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.6))',
                    transition: 'stroke-dasharray 1s ease-out',
                  }}
                />
              )}

              {/* Center: refresh button */}
              <foreignObject x="82" y="62" width="36" height="36">
                <div
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => refetch()}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(212,175,55,0.12)',
                      border: '1.5px solid rgba(212,175,55,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isFetching ? '#d4af37' : '#707070'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }}
                    >
                      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </div>
                </div>
              </foreignObject>
            </svg>

            {/* Steps number — centered below arc */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center" style={{ bottom: -2 }}>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#d4af37] font-mono gold-glow">
                  {steps !== null ? steps.toLocaleString() : '—'}
                </span>
                <span className="text-sm text-[#505050] font-mono">/{goal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Spacer for the number */}
          <div className="mt-7 flex flex-col items-center gap-1">
            <div className="text-xs text-[#707070] font-mono">
              {steps !== null ? `${Math.round(progress)}% of goal` : 'No data today'}
            </div>
            {syncedAt && (
              <div className="text-[10px] text-[#505050]">
                synced {formatTimeAgo(syncedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Card>
  )
}
