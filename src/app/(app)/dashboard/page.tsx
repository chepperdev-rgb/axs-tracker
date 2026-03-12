import { Card } from '@/components/ui/card'

export default function DashboardPage() {
  const currentMonth = new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            HABIT DASHBOARD
          </h1>
          <p className="text-2xl font-semibold text-[#f5f5f5] mt-1">
            {currentMonth}
          </p>
        </div>
        <div className="px-4 py-2 rounded-full border border-[#d4af37] text-[#d4af37] text-sm font-medium">
          6 HABITS IN PLAN
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weekly KPI Card */}
        <Card className="bg-[#141414] border-[#2a2a2a] p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4">
              KPI LEADER — WEEKLY COMPLETION
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-[#d4af37] font-mono">
                0%
              </span>
            </div>
            <div className="space-y-2 text-sm">
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
            <div className="flex items-end gap-1 h-8 mt-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="flex-1 bg-[#2a2a2a] rounded-t h-full" />
              ))}
            </div>
          </div>
        </Card>

        {/* Monthly Score Card */}
        <Card className="bg-[#141414] border-[#2a2a2a] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4">
            MONTHLY SCORE
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-[#d4af37] font-mono">
              11
            </span>
            <span className="text-[#a0a0a0]">/100 (completion + streak)</span>
          </div>
        </Card>

        {/* Completion Rate Card */}
        <Card className="bg-[#141414] border-[#2a2a2a] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4">
            COMPLETION RATIO
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-[#d4af37] font-mono">
              0.6
            </span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line Chart Placeholder */}
        <Card className="bg-[#141414] border-[#2a2a2a] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4">
            COMPLETION % PER DAY
          </h3>
          <div className="h-48 flex items-center justify-center text-[#707070]">
            Chart coming soon...
          </div>
        </Card>

        {/* Bar Chart Placeholder */}
        <Card className="bg-[#141414] border-[#2a2a2a] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4">
            HABITS COMPLETED PER DAY
          </h3>
          <p className="text-sm text-[#707070] mb-4">Stacked by day</p>
          <div className="h-40 flex items-center justify-center text-[#707070]">
            Chart coming soon...
          </div>
        </Card>

        {/* Donut Chart Placeholder */}
        <Card className="bg-[#141414] border-[#2a2a2a] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4">
            MONTHLY COMPLETION
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
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
                  stroke="#d4af37"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="251.2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#d4af37] font-mono">0%</span>
                <span className="text-xs text-[#707070] uppercase">Month</span>
              </div>
            </div>
          </div>
          <div className="flex justify-around mt-4 pt-4 border-t border-[#2a2a2a]">
            <div className="text-center">
              <div className="text-lg font-mono text-[#f5f5f5]">0</div>
              <div className="text-xs text-[#707070]">Check-ins</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono text-[#f5f5f5]">0</div>
              <div className="text-xs text-[#707070]">Active days</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono text-[#f5f5f5]">0</div>
              <div className="text-xs text-[#707070]">Best streak</div>
            </div>
          </div>
        </Card>

        {/* Heatmap Placeholder */}
        <Card className="bg-[#141414] border-[#2a2a2a] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-2">
            MINI HEATMAP
          </h3>
          <p className="text-sm text-[#707070] mb-4">Day intensity (completion)</p>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-sm bg-[#2a2a2a]/50"
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#2a2a2a]">
            <span className="text-xs text-[#707070]">0%</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#2a2a2a]/50" />
              <div className="w-3 h-3 rounded-sm bg-[#d4af37]/20" />
              <div className="w-3 h-3 rounded-sm bg-[#d4af37]/40" />
              <div className="w-3 h-3 rounded-sm bg-[#d4af37]/70" />
              <div className="w-3 h-3 rounded-sm bg-[#d4af37]" />
            </div>
            <span className="text-xs text-[#707070]">100%</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
