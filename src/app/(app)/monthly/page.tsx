'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Star, Plus } from 'lucide-react'

const mockHabits = [
  { id: '1', name: 'Wake before 6:30', completed: [1, 2, 3, 4, 5, 6, 7] },
  { id: '2', name: 'No phone after 10pm', completed: [3, 4] },
  { id: '3', name: 'Movement / workout', completed: [2, 3, 4] },
  { id: '4', name: 'Reading (20 min)', completed: [4, 6] },
  { id: '5', name: 'Evening shutdown & plan', completed: [3, 4, 5] },
  { id: '6', name: 'Budget / expense tracking', completed: [4] },
]

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthlyPage() {
  const [activeWeek, setActiveWeek] = useState(1)
  const weeks = [1, 2, 3, 4, 5]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            MONTHLY GRID
          </h1>
          <p className="text-lg text-[#f5f5f5] mt-1">
            Full month, by weeks
          </p>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#141414] rounded-lg border border-[#2a2a2a]">
            <span className="text-[#707070]">MONTH</span>
            <span className="text-[#f5f5f5] font-medium">March</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#141414] rounded-lg border border-[#2a2a2a]">
            <span className="text-[#707070]">YEAR</span>
            <span className="text-[#f5f5f5] font-medium">2026</span>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#a0a0a0]">
          6 habits × 31 days · <span className="text-[#d4af37]">Week 1 – 5</span>
        </p>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            ADD FROM LIBRARY
          </Button>
          <span className="text-sm text-[#a0a0a0]">This month <span className="text-[#d4af37]">39%</span></span>
        </div>
      </div>

      {/* Week Tabs */}
      <div className="flex items-center gap-2">
        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => setActiveWeek(week)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200
              ${activeWeek === week
                ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]'
                : 'bg-transparent border-[#2a2a2a] text-[#a0a0a0] hover:border-[#3a3a3a] hover:text-[#f5f5f5]'
              }
            `}
          >
            Week {week}
          </button>
        ))}
      </div>

      {/* Habit Grid */}
      <Card className="bg-[#141414] border-[#2a2a2a] overflow-hidden">
        {/* Grid Header */}
        <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 items-center py-3 px-4 border-b border-[#2a2a2a] bg-[#1c1c1c]">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#707070]">
            HABIT
          </div>
          {weekDays.map((day, i) => (
            <div key={day} className="text-center">
              <div className="text-xs text-[#707070] uppercase">{day}</div>
              <div className="text-sm text-[#f5f5f5] font-medium">{i + 1}</div>
            </div>
          ))}
        </div>

        {/* Grid Rows */}
        {mockHabits.map((habit) => (
          <div
            key={habit.id}
            className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 items-center py-3 px-4 border-b border-[#2a2a2a]/50 hover:bg-[#1c1c1c]/50 transition-colors"
          >
            {/* Habit Name */}
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4 text-[#d4af37]" />
              <span className="text-[#f5f5f5] font-medium truncate">
                {habit.name}
              </span>
            </div>

            {/* Day Checkboxes */}
            {weekDays.map((_, dayIndex) => {
              const isCompleted = habit.completed.includes(dayIndex + 1)
              return (
                <div key={dayIndex} className="flex justify-center">
                  <button
                    className={`
                      w-8 h-8 rounded-lg border-2 flex items-center justify-center
                      transition-all duration-200 active:scale-95
                      ${isCompleted
                        ? 'bg-[#d4af37] border-[#d4af37] text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                        : 'bg-transparent border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1c1c1c]'
                      }
                    `}
                  >
                    {isCompleted && <Check className="w-5 h-5 stroke-[3]" />}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </Card>

      {/* Analysis Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
          ANALYSIS
        </h2>

        <div className="space-y-3">
          {mockHabits.map((habit) => {
            const percentage = Math.round((habit.completed.length / 31) * 100)
            return (
              <div key={habit.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#f5f5f5] font-medium">{habit.name}</span>
                  <span className="text-sm text-[#a0a0a0]">
                    Goal 31 days · <span className="text-[#d4af37]">{habit.completed.length} completed</span>
                  </span>
                </div>
                <div className="h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#9a8330] via-[#d4af37] to-[#f0d060] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
