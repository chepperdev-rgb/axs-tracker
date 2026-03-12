'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            DAILY TASKS
          </h1>
          <p className="text-lg text-[#f5f5f5] mt-1">
            Weekly planner
          </p>
        </div>

        <Button
          variant="outline"
          className="border-[#2a2a2a] text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]"
        >
          Daily Review
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#2a2a2a] text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev week
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-[#2a2a2a] text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]"
          >
            Next week
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="text-lg font-medium text-[#f5f5f5]">
          {weekRange}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-[#141414] rounded-lg border border-[#2a2a2a]">
          <span className="text-[#f5f5f5] font-medium">2026</span>
        </div>
      </div>

      {/* Week Progress */}
      <Card className="bg-[#141414] border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            WEEK: <span className="text-[#d4af37]">2/3</span>
          </span>
          <span className="text-sm text-[#707070]">Based on created tasks</span>
        </div>
        <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#d4af37] rounded-full transition-all"
            style={{ width: '66%' }}
          />
        </div>
      </Card>

      {/* Day Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
                bg-[#141414] overflow-hidden
                ${isToday ? 'border-[#d4af37]' : 'border-[#2a2a2a]'}
              `}
            >
              {/* Day Header */}
              <div
                className={`
                  p-3 border-b
                  ${isToday ? 'border-[#d4af37]/30 bg-[#d4af37]/5' : 'border-[#2a2a2a]'}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-sm font-semibold uppercase
                      ${isToday ? 'text-[#d4af37]' : 'text-[#f5f5f5]'}
                    `}
                  >
                    {day}
                  </span>
                  <span className="text-xs text-[#707070] font-mono">
                    {completedCount}/{totalCount}
                  </span>
                </div>
                <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#d4af37] rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Tasks */}
              <div className="p-3 space-y-2 min-h-[120px]">
                {tasks.length === 0 ? (
                  <p className="text-xs text-[#707070] text-center py-4">
                    No tasks yet
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#1c1c1c] transition-colors"
                    >
                      <Checkbox
                        checked={task.completed}
                        className={`
                          mt-0.5 border-[#2a2a2a]
                          data-[state=checked]:bg-[#d4af37]
                          data-[state=checked]:border-[#d4af37]
                        `}
                      />
                      <span
                        className={`
                          text-sm
                          ${task.completed ? 'text-[#707070] line-through' : 'text-[#f5f5f5]'}
                        `}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))
                )}

                {/* Add Task */}
                <button className="flex items-center gap-2 text-[#707070] hover:text-[#d4af37] text-sm transition-colors w-full p-2 rounded-lg hover:bg-[#1c1c1c]">
                  <Plus className="w-4 h-4" />
                  Add task
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Weekly Analytics */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
          WEEKLY ANALYTICS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weekly Completion Donut */}
          <Card className="bg-[#141414] border-[#2a2a2a] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4 text-center">
              WEEKLY COMPLETION
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
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
                    stroke="#d4af37"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="83.7"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#d4af37] font-mono">67%</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#707070] text-center mt-3">
              Based on created tasks
            </p>
          </Card>

          {/* Daily Completion Donut */}
          <Card className="bg-[#141414] border-[#2a2a2a] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4 text-center">
              DAILY COMPLETION
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
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
                    stroke="#d4af37"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#d4af37] font-mono">100%</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#707070] text-center mt-3">
              Today's progress
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
