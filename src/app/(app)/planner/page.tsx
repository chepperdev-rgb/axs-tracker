'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const weekDaysShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const mockTasks: Record<string, { id: string; title: string; completed: boolean }[]> = {
  MON: [],
  TUE: [
    { id: '1', title: 'Review quarterly goals', completed: true },
    { id: '2', title: 'Prepare presentation', completed: false },
  ],
  WED: [
    { id: '3', title: 'Team standup', completed: true },
  ],
  THU: [],
  FRI: [],
  SAT: [],
  SUN: [],
}

export default function PlannerPage() {
  const [weekRange] = useState('Mar 2 – 8, 2026')

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            DAILY TASKS
          </h1>
          <p className="text-base sm:text-lg text-gold-gradient mt-1">
            Weekly planner
          </p>
        </div>

        <Button
          variant="glass"
          size="sm"
          className="self-start sm:self-auto text-xs sm:text-sm"
        >
          Daily Review
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 order-2 sm:order-1">
          <Button
            variant="glass"
            size="sm"
            className="text-xs"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Prev</span>
          </Button>
          <Button
            variant="glass"
            size="sm"
            className="text-xs"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        <div className="text-base sm:text-lg font-medium text-[#f5f5f5] order-1 sm:order-2">
          {weekRange}
        </div>

        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass-card rounded-lg order-3 self-start sm:self-auto">
          <span className="text-sm sm:text-base text-[#f5f5f5] font-medium">2026</span>
        </div>
      </div>

      {/* Week Progress */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            WEEK: <span className="text-[#d4af37] gold-glow">2/3</span>
          </span>
          <span className="text-[10px] sm:text-sm text-[#707070]">Based on created tasks</span>
        </div>
        <div className="h-1.5 sm:h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#9a8330] via-[#d4af37] to-[#f0d060] rounded-full transition-all shadow-[0_0_10px_rgba(212,175,55,0.4)]"
            style={{ width: '66%' }}
          />
        </div>
      </Card>

      {/* Day Grid - Horizontally scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        <div className="grid grid-cols-7 gap-2 sm:gap-4 min-w-[700px] sm:min-w-0">
          {weekDays.map((day, index) => {
            const tasks = mockTasks[day] || []
            const completedCount = tasks.filter((t) => t.completed).length
            const totalCount = tasks.length
            const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
            const isToday = day === 'WED'

            return (
              <Card
                key={day}
                className={`
                  overflow-hidden p-0
                  ${isToday ? 'border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]' : ''}
                `}
              >
                {/* Day Header */}
                <div
                  className={`
                    p-2 sm:p-3 border-b
                    ${isToday ? 'border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.1)]' : 'border-[rgba(212,175,55,0.1)]'}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`
                        text-xs sm:text-sm font-semibold uppercase
                        ${isToday ? 'text-[#d4af37] gold-glow' : 'text-[#f5f5f5]'}
                      `}
                    >
                      <span className="sm:hidden">{weekDaysShort[index]}</span>
                      <span className="hidden sm:inline">{day}</span>
                    </span>
                    <span className="text-[10px] sm:text-xs text-[#707070] font-mono">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                  <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0d060] rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2 min-h-[100px] sm:min-h-[120px]">
                  {tasks.length === 0 ? (
                    <p className="text-[10px] sm:text-xs text-[#707070] text-center py-3 sm:py-4">
                      No tasks
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(212,175,55,0.05)] transition-colors"
                      >
                        <Checkbox
                          checked={task.completed}
                          className={`
                            mt-0.5 border-[#2a2a2a] w-3.5 h-3.5 sm:w-4 sm:h-4
                            data-[state=checked]:bg-[#d4af37]
                            data-[state=checked]:border-[#d4af37]
                          `}
                        />
                        <span
                          className={`
                            text-[10px] sm:text-sm leading-tight
                            ${task.completed ? 'text-[#707070] line-through' : 'text-[#f5f5f5]'}
                          `}
                        >
                          {task.title}
                        </span>
                      </div>
                    ))
                  )}

                  {/* Add Task */}
                  <button className="flex items-center gap-1 sm:gap-2 text-[#707070] hover:text-[#d4af37] text-[10px] sm:text-sm transition-colors w-full p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(212,175,55,0.05)]">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add task</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Weekly Analytics */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
          WEEKLY ANALYTICS
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Weekly Completion Donut */}
          <Card className="p-3 sm:p-5">
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4 text-center">
              WEEKLY
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-20 h-20 sm:w-32 sm:h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2a2a2a"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#weeklyGradient)"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="83.7"
                    strokeLinecap="round"
                    className="gold-glow"
                  />
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#f0d060" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg sm:text-2xl font-bold text-[#d4af37] font-mono">67%</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-[#707070] text-center mt-2 sm:mt-3">
              Based on tasks
            </p>
          </Card>

          {/* Daily Completion Donut */}
          <Card className="p-3 sm:p-5">
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4 text-center">
              TODAY
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-20 h-20 sm:w-32 sm:h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2a2a2a"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#dailyGradient)"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="gold-glow"
                  />
                  <defs>
                    <linearGradient id="dailyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#f0d060" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg sm:text-2xl font-bold text-[#d4af37] font-mono">100%</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-[#707070] text-center mt-2 sm:mt-3">
              Today's progress
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
