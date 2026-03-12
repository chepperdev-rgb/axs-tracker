'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Star, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const mockHabits = [
  { id: '1', name: 'Wake before 6:30', completed: [1, 2, 3, 4, 5, 6, 7] },
  { id: '2', name: 'No phone after 10pm', completed: [3, 4] },
  { id: '3', name: 'Movement / workout', completed: [2, 3, 4] },
  { id: '4', name: 'Reading (20 min)', completed: [4, 6] },
  { id: '5', name: 'Evening shutdown & plan', completed: [3, 4, 5] },
  { id: '6', name: 'Budget / expense tracking', completed: [4] },
]

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weekDaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function MonthlyPage() {
  const [activeWeek, setActiveWeek] = useState(1)
  const weeks = [1, 2, 3, 4, 5]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            MONTHLY GRID
          </h1>
          <p className="text-base sm:text-lg text-gold-gradient mt-1">
            Full month, by weeks
          </p>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass-card rounded-lg">
            <span className="text-[10px] sm:text-xs text-[#707070]">MONTH</span>
            <span className="text-xs sm:text-sm text-[#f5f5f5] font-medium">March</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass-card rounded-lg">
            <span className="text-[10px] sm:text-xs text-[#707070]">YEAR</span>
            <span className="text-xs sm:text-sm text-[#f5f5f5] font-medium">2026</span>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <p className="text-xs sm:text-sm text-[#a0a0a0]">
          6 habits × 31 days · <span className="text-[#d4af37]">Week 1 – 5</span>
        </p>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="gold-outline"
            size="sm"
            className="text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">ADD FROM LIBRARY</span>
            <span className="sm:hidden">ADD</span>
          </Button>
          <span className="text-xs sm:text-sm text-[#a0a0a0]">
            Month <span className="text-[#d4af37] gold-glow">39%</span>
          </span>
        </div>
      </div>

      {/* Week Tabs - Scrollable on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => setActiveWeek(week)}
            className={`
              px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0
              ${activeWeek === week
                ? 'bg-[rgba(212,175,55,0.15)] border-[#d4af37] text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                : 'bg-transparent border-[#2a2a2a] text-[#a0a0a0] hover:border-[#3a3a3a] hover:text-[#f5f5f5]'
              }
            `}
          >
            <span className="sm:hidden">W{week}</span>
            <span className="hidden sm:inline">Week {week}</span>
          </button>
        ))}
      </div>

      {/* Habit Grid - Horizontally scrollable on mobile */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Grid Header */}
            <div className="grid grid-cols-[minmax(120px,150px)_repeat(7,1fr)] sm:grid-cols-[200px_repeat(7,1fr)] gap-1 sm:gap-2 items-center py-2 sm:py-3 px-3 sm:px-4 border-b border-[rgba(212,175,55,0.15)] bg-[rgba(0,0,0,0.3)]">
              <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#707070]">
                HABIT
              </div>
              {weekDays.map((day, i) => (
                <div key={day} className="text-center">
                  <div className="text-[10px] sm:text-xs text-[#707070] uppercase">
                    <span className="sm:hidden">{weekDaysShort[i]}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-[#f5f5f5] font-medium">{i + 1}</div>
                </div>
              ))}
            </div>

            {/* Grid Rows */}
            {mockHabits.map((habit) => (
              <div
                key={habit.id}
                className="grid grid-cols-[minmax(120px,150px)_repeat(7,1fr)] sm:grid-cols-[200px_repeat(7,1fr)] gap-1 sm:gap-2 items-center py-2 sm:py-3 px-3 sm:px-4 border-b border-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.03)] transition-colors"
              >
                {/* Habit Name */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#d4af37] flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-[#f5f5f5] font-medium truncate">
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
                          w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border-2 flex items-center justify-center
                          transition-all duration-200 active:scale-95
                          ${isCompleted
                            ? 'btn-luxury border-transparent shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                            : 'bg-transparent border-[#2a2a2a] hover:border-[rgba(212,175,55,0.3)] hover:bg-[rgba(212,175,55,0.05)]'
                          }
                        `}
                      >
                        {isCompleted && <Check className="w-3 h-3 sm:w-5 sm:h-5 stroke-[3] text-black" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Analysis Section */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
          ANALYSIS
        </h2>

        <div className="space-y-3">
          {mockHabits.map((habit) => {
            const percentage = Math.round((habit.completed.length / 31) * 100)
            return (
              <Card key={habit.id} className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 mb-2">
                  <span className="text-xs sm:text-sm text-[#f5f5f5] font-medium">{habit.name}</span>
                  <span className="text-[10px] sm:text-sm text-[#a0a0a0]">
                    Goal 31 · <span className="text-[#d4af37]">{habit.completed.length} done</span>
                  </span>
                </div>
                <div className="h-2 sm:h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#9a8330] via-[#d4af37] to-[#f0d060] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
