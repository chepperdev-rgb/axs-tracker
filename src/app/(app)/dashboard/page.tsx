'use client'

import { Card } from '@/components/ui/card'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useEffect, useState } from 'react'
import { useTranslations, useI18n } from '@/providers/i18n-provider'
import { TachometerGauge, CircularGauge } from '@/components/ui/tachometer-gauge'

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#2a2a2a] rounded ${className}`} />
  )
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(startValue + (value - startValue) * easeOut)

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return <>{displayValue}</>
}

function WeeklyBarChart({ data, days }: { data: number[]; days?: string[] }) {
  const dayLabels = days ?? ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="flex items-end gap-1 h-6 sm:h-8 mt-3 sm:mt-4">
      {dayLabels.map((day, i) => {
        const height = data[i] > 0 ? Math.max((data[i] / 100) * 100, 10) : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t transition-all duration-500 ease-out"
              style={{
                height: `${height}%`,
                backgroundColor: data[i] > 0
                  ? `rgba(212, 175, 55, ${0.3 + (data[i] / 100) * 0.7})`
                  : '#2a2a2a',
              }}
            />
            <span className="text-[8px] sm:text-[10px] text-[#707070] mt-1">{day}</span>
          </div>
        )
      })}
    </div>
  )
}

function CumulativeChart({ data }: { data: { date: string; percentage: number }[] }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(timer)
  }, [])

  if (!data || data.length < 2) return null

  // Build cumulative data — only grows or stays flat
  const cumulative: number[] = []
  let total = 0
  for (const day of data) {
    total += day.percentage
    cumulative.push(total)
  }
  const maxVal = Math.max(...cumulative, 1)

  // SVG dimensions
  const w = 500
  const h = 160
  const padX = 30
  const padY = 15
  const chartW = w - padX * 2
  const chartH = h - padY * 2

  // Build path
  const points = cumulative.map((val, i) => {
    const x = padX + (i / (cumulative.length - 1)) * chartW
    const y = padY + chartH - (val / maxVal) * chartH
    return { x, y }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  // Area fill (path + close to bottom)
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="cumLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8a6a2a" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#f0d060" />
          </linearGradient>
          <linearGradient id="cumAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.25)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </linearGradient>
          <filter id="cumGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {gridLines.map((frac, i) => {
          const y = padY + chartH - frac * chartH
          return (
            <line key={i} x1={padX} y1={y} x2={w - padX} y2={y}
              stroke="#1c1c1c" strokeWidth="0.5" />
          )
        })}

        {/* Area fill */}
        <path
          d={areaD}
          fill="url(#cumAreaGrad)"
          opacity={animated ? 1 : 0}
          style={{ transition: 'opacity 1s ease' }}
        />

        {/* Main curve */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#cumLineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#cumGlow)"
          strokeDasharray={animated ? 'none' : '2000'}
          strokeDashoffset={animated ? '0' : '2000'}
          style={{ transition: 'stroke-dashoffset 2s ease-out' }}
        />

        {/* Dots on data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5"
            fill="#d4af37"
            opacity={animated ? 0.8 : 0}
            style={{ transition: `opacity 0.5s ease ${i * 0.05}s` }}
          />
        ))}

        {/* Day labels (every 5th) */}
        {points.map((p, i) => {
          if (i % 5 !== 0 && i !== points.length - 1) return null
          const label = data[i]?.date?.slice(-2) || ''
          return (
            <text key={i} x={p.x} y={h - 2}
              fill="#505050" fontSize="8" textAnchor="middle" fontFamily="system-ui"
            >{label}</text>
          )
        })}
      </svg>
    </div>
  )
}

function HeatmapCell({ percentage, date }: { percentage: number; date: string }) {
  const getColorClass = (pct: number) => {
    if (pct === 0) return 'bg-[#2a2a2a]/50'
    if (pct <= 25) return 'bg-[#d4af37]/20'
    if (pct <= 50) return 'bg-[#d4af37]/40'
    if (pct <= 75) return 'bg-[#d4af37]/70'
    return 'bg-[#d4af37]'
  }

  return (
    <div
      className={`aspect-square rounded-sm ${getColorClass(percentage)} hover:ring-1 hover:ring-[#d4af37]/50 transition-all cursor-pointer`}
      title={date ? `${date}: ${percentage}%` : ''}
    />
  )
}

export default function DashboardPage() {
  const t = useTranslations()
  const { locale } = useI18n()
  const currentMonth = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const { data: stats, isLoading, error } = useDashboardStats()

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{t.messages.failedLoadDashboard}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            {t.dashboard.title}
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-gold-gradient mt-1">
            {currentMonth}
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="w-32 h-8 rounded-full" />
        ) : (
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#d4af37] text-[#d4af37] text-xs sm:text-sm font-medium self-start sm:self-auto gold-pulse">
            {stats?.habitsInPlan || 0} {t.dashboard.habitsInPlan}
          </div>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Weekly KPI Card */}
        <Card className="p-4 sm:p-5 relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
              {t.dashboard.kpiLeader}
            </h3>
            {isLoading ? (
              <>
                <Skeleton className="w-24 h-10 mb-2" />
                <div className="space-y-1.5 sm:space-y-2">
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-full h-4" />
                </div>
                <div className="flex items-end gap-1 h-6 sm:h-8 mt-3 sm:mt-4">
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="flex-1 h-full" />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl sm:text-4xl font-bold text-[#d4af37] font-mono gold-glow">
                    <AnimatedNumber value={stats?.weeklyCompletion || 0} />%
                  </span>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#a0a0a0]">{t.dashboard.thisWeek}</span>
                    <span className="text-[#f5f5f5]">
                      {stats?.tasksCompletedThisWeek || 0}/{stats?.totalTasksThisWeek || 0} {t.common.tasks}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a0a0a0]">{t.common.today}</span>
                    <span className="text-[#f5f5f5]">
                      {stats?.tasksCompletedToday || 0}/{stats?.totalTasksToday || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a0a0a0]">{t.dashboard.bestDay}</span>
                    <span className="text-[#d4af37]">
                      {(() => {
                        const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
                        const idx = stats?.bestDay?.day
                        const dayName = typeof idx === 'number' ? t.planner.weekDays[dayKeys[idx]] : 'N/A'
                        return `${dayName} (${stats?.bestDay?.percentage || 0}%)`
                      })()}
                    </span>
                  </div>
                </div>
                <WeeklyBarChart
                  data={stats?.weeklyData || [0, 0, 0, 0, 0, 0, 0]}
                  days={[
                    t.planner.weekDaysShort.mon,
                    t.planner.weekDaysShort.tue,
                    t.planner.weekDaysShort.wed,
                    t.planner.weekDaysShort.thu,
                    t.planner.weekDaysShort.fri,
                    t.planner.weekDaysShort.sat,
                    t.planner.weekDaysShort.sun,
                  ]}
                />
              </>
            )}
          </div>
        </Card>

        {/* Monthly Score Card */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
            {t.dashboard.monthlyScore}
          </h3>
          {isLoading ? (
            <Skeleton className="w-20 h-12" />
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-[#d4af37] font-mono gold-glow">
                  <AnimatedNumber value={stats?.monthlyScore || 0} />
                </span>
                <span className="text-[10px] sm:text-xs text-[#a0a0a0]">/100</span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#707070] mt-1">{t.common.completionAndStreak}</p>
            </>
          )}
        </Card>

        {/* Completion Rate Card */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
            {t.dashboard.completionRatio}
          </h3>
          {isLoading ? (
            <Skeleton className="w-16 h-12" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold text-[#d4af37] font-mono gold-glow">
                {stats?.completionRatio?.toFixed(2) || '0.00'}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Daily Completion Circular Gauges - 7 in a row */}
        <Card className="p-4 sm:p-6 lg:p-8 lg:col-span-2">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4 sm:mb-6">
            {t.dashboard.completionPerDay}
          </h3>
          {isLoading ? (
            <div className="grid grid-cols-7 gap-2 sm:gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 sm:gap-4 lg:gap-6">
              {[
                t.planner.weekDays.mon, t.planner.weekDays.tue, t.planner.weekDays.wed,
                t.planner.weekDays.thu, t.planner.weekDays.fri, t.planner.weekDays.sat,
                t.planner.weekDays.sun
              ].map((day, i) => (
                <CircularGauge
                  key={i}
                  percentage={stats?.weeklyData?.[i] || 0}
                  label={day}
                  responsive
                />
              ))}
            </div>
          )}
        </Card>

        {/* Weekly Tachometer Gauges */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-2 sm:mb-4">
            {t.dashboard.habitsCompletedPerDay}
          </h3>
          <p className="text-[10px] sm:text-sm text-[#707070] mb-3 sm:mb-4">{t.dashboard.stackedByDay}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {isLoading ? (
              <>
                <Skeleton className="w-24 h-16" />
                <Skeleton className="w-24 h-16" />
                <Skeleton className="w-24 h-16" />
              </>
            ) : (
              <>
                <TachometerGauge
                  percentage={stats?.weeklyCompletion || 0}
                  size="sm"
                  label={t.common.week}
                />
                <TachometerGauge
                  percentage={stats?.monthlyCompletion || 0}
                  size="sm"
                  label={t.common.month}
                />
                <TachometerGauge
                  percentage={Math.round((stats?.completionRatio || 0) * 100)}
                  size="sm"
                  label={t.common.ratio}
                />
              </>
            )}
          </div>
        </Card>

        {/* Tachometer Gauge - Monthly Completion */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
            {t.dashboard.monthlyCompletion}
          </h3>
          <div className="flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="w-40 h-24 rounded" />
            ) : (
              <TachometerGauge
                percentage={stats?.monthlyCompletion || 0}
                size="lg"
                label={t.common.month}
              />
            )}
          </div>
          <div className="flex justify-around mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[rgba(212,175,55,0.15)]">
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="w-8 h-5 mx-auto mb-1" />
              ) : (
                <div className="text-base sm:text-lg font-mono text-[#f5f5f5]">
                  <AnimatedNumber value={stats?.checkIns || 0} />
                </div>
              )}
              <div className="text-[10px] sm:text-xs text-[#707070]">{t.dashboard.checkIns}</div>
            </div>
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="w-8 h-5 mx-auto mb-1" />
              ) : (
                <div className="text-base sm:text-lg font-mono text-[#f5f5f5]">
                  <AnimatedNumber value={stats?.activeDays || 0} />
                </div>
              )}
              <div className="text-[10px] sm:text-xs text-[#707070]">{t.dashboard.activeDays}</div>
            </div>
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="w-8 h-5 mx-auto mb-1" />
              ) : (
                <div className="text-base sm:text-lg font-mono text-[#f5f5f5]">
                  <AnimatedNumber value={stats?.bestStreak || 0} />
                </div>
              )}
              <div className="text-[10px] sm:text-xs text-[#707070]">{t.dashboard.bestStreak}</div>
            </div>
          </div>
        </Card>

        {/* Heatmap */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-1 sm:mb-2">
            {t.dashboard.miniHeatmap}
          </h3>
          <p className="text-[10px] sm:text-sm text-[#707070] mb-3 sm:mb-4">{t.dashboard.dayIntensity}</p>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {isLoading ? (
              Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-sm" />
              ))
            ) : (
              stats?.heatmapData?.map((day, i) => (
                <HeatmapCell key={i} percentage={day.percentage} date={day.date} />
              )) || Array.from({ length: 35 }).map((_, i) => (
                <HeatmapCell key={i} percentage={0} date="" />
              ))
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[rgba(212,175,55,0.15)]">
            <span className="text-[10px] sm:text-xs text-[#707070]">0%</span>
            <div className="flex gap-0.5 sm:gap-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-[#2a2a2a]/50" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-[#d4af37]/20" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-[#d4af37]/40" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-[#d4af37]/70" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm bg-[#d4af37]" />
            </div>
            <span className="text-[10px] sm:text-xs text-[#707070]">100%</span>
          </div>
        </Card>

        {/* Weekly Pulse — tall bar chart like the reference design */}
        <Card className="p-4 sm:p-5 flex flex-col">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-1 sm:mb-2">
            {t.dashboard.weeklyPulse}
          </h3>
          <p className="text-[10px] sm:text-sm text-[#707070] mb-4 sm:mb-6">{t.dashboard.sevenDayView}</p>
          {isLoading ? (
            <div className="flex items-end gap-2 sm:gap-3 flex-1 min-h-[10rem]">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="flex-1 h-full rounded-t-lg" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Bars container — fills remaining space, bars grow from bottom */}
              <div className="flex items-end gap-2 sm:gap-3 flex-1 min-h-[10rem]">
                {(stats?.weeklyData || Array.from({ length: 7 }, () => 0)).map((pct: number, i: number) => {
                  const barH = pct > 0 ? Math.max(pct, 5) : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      {pct > 0 && (
                        <span className="text-[10px] sm:text-xs font-mono font-bold text-[#d4af37] mb-1.5">
                          {pct}%
                        </span>
                      )}
                      <div
                        className="w-full rounded-t-lg transition-all duration-700 ease-out"
                        style={{
                          height: `${barH}%`,
                          background: pct > 0
                            ? 'linear-gradient(to top, #8a6a2a, #d4af37, #f0d060)'
                            : '#2a2a2a',
                          boxShadow: pct > 50
                            ? '0 0 12px rgba(212,175,55,0.4), 0 0 24px rgba(212,175,55,0.15)'
                            : pct > 0
                            ? '0 0 6px rgba(212,175,55,0.2)'
                            : 'none',
                          minHeight: '4px',
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              {/* Day labels — separate row below bars */}
              <div className="flex gap-2 sm:gap-3 mt-2">
                {[
                  t.planner.weekDaysShort.mon, t.planner.weekDaysShort.tue, t.planner.weekDaysShort.wed,
                  t.planner.weekDaysShort.thu, t.planner.weekDaysShort.fri, t.planner.weekDaysShort.sat,
                  t.planner.weekDaysShort.sun
                ].map((day, i) => (
                  <span key={i} className="flex-1 text-center text-[9px] sm:text-xs text-[#707070] font-medium uppercase">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Cumulative Progress Chart */}
        <Card className="p-4 sm:p-5 lg:col-span-2">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
            {t.dashboard.cumulativeProgress}
          </h3>
          {isLoading ? (
            <Skeleton className="w-full h-32 sm:h-40 rounded" />
          ) : (
            <CumulativeChart data={stats?.heatmapData || []} />
          )}
        </Card>
      </div>
    </div>
  )
}
