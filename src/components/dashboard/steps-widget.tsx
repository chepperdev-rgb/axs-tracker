'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useStepsData } from '@/hooks/useStepsData'
import { Footprints, Loader2, RefreshCw } from 'lucide-react'

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
  const { steps, source, syncedAt, isLoading, isFetching, refetch, updateSteps, isUpdating } = useStepsData(date)
  const [manualInput, setManualInput] = useState('')
  const [showInput, setShowInput] = useState(false)

  const progress = steps ? Math.min((steps / goal) * 100, 100) : 0

  // SVG circular progress params
  const size = 100
  const strokeWidth = size * 0.1
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const handleSubmit = () => {
    const val = parseInt(manualInput, 10)
    if (isNaN(val) || val < 0) return
    updateSteps({ date, steps: val, source: 'manual' })
    setManualInput('')
    setShowInput(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') {
      setShowInput(false)
      setManualInput('')
    }
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
        <div className="flex items-center justify-center py-6">
          <div className="animate-pulse bg-[#2a2a2a] rounded-full w-24 h-24" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Footprints className="w-4 h-4 text-[#d4af37]" />
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
              Daily Steps
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {source && (
              <span className="text-[10px] text-[#707070] px-2 py-0.5 rounded-full bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.15)]">
                {source === 'shortcuts' ? 'Shortcuts' : source === 'manual' ? 'Manual' : source}
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh steps"
              className="p-1 rounded-lg text-[#505050] hover:text-[#d4af37] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#d4af37]' : ''}`} />
            </button>
          </div>
        </div>

        {steps !== null ? (
          /* Has data state */
          <div className="flex flex-col items-center">
            {/* Circular progress */}
            <div className="relative" style={{ width: size, height: size }}>
              <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="url(#stepsGoldGradient)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.5))',
                  }}
                />
                <defs>
                  <linearGradient id="stepsGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8a6a2a" />
                    <stop offset="50%" stopColor="#d4af37" />
                    <stop offset="100%" stopColor="#f0d060" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-[#d4af37] font-mono gold-glow leading-none">
                  {steps.toLocaleString()}
                </span>
                <span className="text-[9px] text-[#707070] mt-0.5">
                  / {goal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Percentage */}
            <div className="mt-2 text-xs text-[#a0a0a0] font-mono">
              {Math.round(progress)}% of goal
            </div>

            {/* Synced time */}
            {syncedAt && (
              <div className="mt-1 text-[10px] text-[#505050]">
                synced {formatTimeAgo(syncedAt)}
              </div>
            )}

            {/* Edit button */}
            {!showInput && (
              <button
                onClick={() => setShowInput(true)}
                className="mt-3 text-[10px] text-[#505050] hover:text-[#d4af37] transition-colors"
              >
                Edit steps
              </button>
            )}

            {/* Inline edit input */}
            {showInput && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={String(steps)}
                  autoFocus
                  className="w-20 px-2 py-1 text-xs bg-[rgba(0,0,0,0.3)] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] placeholder:text-[#3a3a3a] focus:border-[#d4af37] focus:outline-none font-mono text-center"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isUpdating}
                  className="px-2 py-1 text-[10px] font-medium bg-[rgba(212,175,55,0.15)] text-[#d4af37] rounded-lg hover:bg-[rgba(212,175,55,0.25)] transition-colors disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center py-4">
            {/* Empty circular progress */}
            <div className="relative" style={{ width: size, height: size }}>
              <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth={strokeWidth}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Footprints className="w-5 h-5 text-[#3a3a3a]" />
              </div>
            </div>

            <p className="text-xs text-[#505050] mt-3 mb-3">No steps recorded today</p>

            {!showInput ? (
              <button
                onClick={() => setShowInput(true)}
                className="px-4 py-1.5 text-xs font-medium bg-[rgba(212,175,55,0.15)] text-[#d4af37] rounded-lg hover:bg-[rgba(212,175,55,0.25)] transition-colors border border-[rgba(212,175,55,0.2)]"
              >
                Enter steps
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0"
                  autoFocus
                  className="w-24 px-2 py-1.5 text-xs bg-[rgba(0,0,0,0.3)] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] placeholder:text-[#3a3a3a] focus:border-[#d4af37] focus:outline-none font-mono text-center"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isUpdating}
                  className="px-3 py-1.5 text-xs font-medium bg-[rgba(212,175,55,0.15)] text-[#d4af37] rounded-lg hover:bg-[rgba(212,175,55,0.25)] transition-colors disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
