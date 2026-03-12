import { Card } from '@/components/ui/card'

export default function DashboardPage() {
  const currentMonth = new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            HABIT DASHBOARD
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-gold-gradient mt-1">
            {currentMonth}
          </p>
        </div>
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#d4af37] text-[#d4af37] text-xs sm:text-sm font-medium self-start sm:self-auto gold-pulse">
          6 HABITS IN PLAN
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Weekly KPI Card */}
        <Card className="p-4 sm:p-5 relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
              KPI LEADER — WEEKLY COMPLETION
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-bold text-[#d4af37] font-mono gold-glow">
                0%
              </span>
            </div>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-[#a0a0a0]">This Week</span>
                <span className="text-[#f5f5f5]">0/1 tasks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a0a0a0]">Today</span>
                <span className="text-[#f5f5f5]">0/0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a0a0a0]">Best Day</span>
                <span className="text-[#d4af37]">Sat (0%)</span>
              </div>
            </div>
            {/* Mini bar chart placeholder */}
            <div className="flex items-end gap-1 h-6 sm:h-8 mt-3 sm:mt-4">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[#2a2a2a] rounded-t h-full hover:bg-[rgba(212,175,55,0.3)] transition-colors" />
                  <span className="text-[8px] sm:text-[10px] text-[#707070] mt-1">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Monthly Score Card */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
            MONTHLY SCORE
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-[#d4af37] font-mono gold-glow">
              11
            </span>
            <span className="text-[10px] sm:text-xs text-[#a0a0a0]">/100</span>
          </div>
          <p className="text-[10px] sm:text-xs text-[#707070] mt-1">completion + streak</p>
        </Card>

        {/* Completion Rate Card */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
            COMPLETION RATIO
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-[#d4af37] font-mono gold-glow">
              0.6
            </span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Line Chart Placeholder */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
            COMPLETION % PER DAY
          </h3>
          <div className="h-32 sm:h-48 flex items-center justify-center text-[#707070] text-sm">
            Chart coming soon...
          </div>
        </Card>

        {/* Bar Chart Placeholder */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-2 sm:mb-4">
            HABITS COMPLETED PER DAY
          </h3>
          <p className="text-[10px] sm:text-sm text-[#707070] mb-3 sm:mb-4">Stacked by day</p>
          <div className="h-28 sm:h-40 flex items-center justify-center text-[#707070] text-sm">
            Chart coming soon...
          </div>
        </Card>

        {/* Donut Chart Placeholder */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
            MONTHLY COMPLETION
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-28 h-28 sm:w-40 sm:h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#goldGradient)"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="251.2"
                  strokeLinecap="round"
                  className="gold-glow"
                />
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="50%" stopColor="#f0d060" />
                    <stop offset="100%" stopColor="#d4af37" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-[#d4af37] font-mono">0%</span>
                <span className="text-[10px] sm:text-xs text-[#707070] uppercase">Month</span>
              </div>
            </div>
          </div>
          <div className="flex justify-around mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[rgba(212,175,55,0.15)]">
            <div className="text-center">
              <div className="text-base sm:text-lg font-mono text-[#f5f5f5]">0</div>
              <div className="text-[10px] sm:text-xs text-[#707070]">Check-ins</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg font-mono text-[#f5f5f5]">0</div>
              <div className="text-[10px] sm:text-xs text-[#707070]">Active days</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg font-mono text-[#f5f5f5]">0</div>
              <div className="text-[10px] sm:text-xs text-[#707070]">Best streak</div>
            </div>
          </div>
        </Card>

        {/* Heatmap Placeholder */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-1 sm:mb-2">
            MINI HEATMAP
          </h3>
          <p className="text-[10px] sm:text-sm text-[#707070] mb-3 sm:mb-4">Day intensity (completion)</p>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-sm bg-[#2a2a2a]/50 hover:bg-[rgba(212,175,55,0.2)] transition-colors cursor-pointer"
              />
            ))}
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
      </div>
    </div>
  )
}
