'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, MoreHorizontal, Archive, Trash2, Calendar } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const mockHabits = [
  { id: '1', name: 'Wake before 6:30', inCurrentMonth: true },
  { id: '2', name: 'No phone after 10pm', inCurrentMonth: true },
  { id: '3', name: 'Movement / workout', inCurrentMonth: true },
  { id: '4', name: 'Reading (20 min)', inCurrentMonth: true },
  { id: '5', name: 'Evening shutdown & plan', inCurrentMonth: true },
  { id: '6', name: 'Budget / expense tracking', inCurrentMonth: true },
]

export default function HabitsPage() {
  const [newHabit, setNewHabit] = useState('')

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            HABIT LIBRARY
          </h1>
          <p className="text-sm sm:text-lg text-[#f5f5f5] mt-1">
            Manage your habit library. Add to the current month explicitly to track.
          </p>
        </div>
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[rgba(212,175,55,0.3)] text-[#a0a0a0] text-xs sm:text-sm self-start">
          <span className="text-[#d4af37] font-semibold gold-glow">{mockHabits.length}</span> ACTIVE
        </div>
      </div>

      {/* Add Habit Form */}
      <Card className="p-3 sm:p-5">
        <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
          ADD TO LIBRARY
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Evening shutdown routine"
            className="flex-1 bg-[rgba(0,0,0,0.3)] border-[rgba(212,175,55,0.15)] text-[#f5f5f5] placeholder:text-[#707070] focus:border-[#d4af37] focus:ring-[#d4af37]/20 text-sm"
          />
          <Button variant="luxury" className="w-full sm:w-auto px-4 sm:px-6 text-xs sm:text-sm">
            <span className="hidden sm:inline">SAVE TO LIBRARY</span>
            <span className="sm:hidden">SAVE</span>
          </Button>
        </div>
      </Card>

      {/* Habit List */}
      <div className="space-y-2">
        {mockHabits.map((habit) => (
          <Card
            key={habit.id}
            className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between hover:border-[rgba(212,175,55,0.3)] transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] flex-shrink-0 gold-glow" />
              <span className="text-sm sm:text-base text-[#f5f5f5] font-medium">{habit.name}</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {habit.inCurrentMonth ? (
                <span className="px-2 sm:px-3 py-1 rounded-full bg-[rgba(212,175,55,0.15)] text-[#d4af37] text-[10px] sm:text-xs font-medium border border-[rgba(212,175,55,0.3)]">
                  IN MONTH
                </span>
              ) : (
                <Button
                  variant="gold-outline"
                  size="sm"
                  className="text-xs"
                >
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add to Month</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-[#707070] hover:text-[#f5f5f5] hover:bg-[rgba(212,175,55,0.1)]"
                  >
                    <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="glass-card rounded-xl"
                >
                  <DropdownMenuItem className="text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[#e74c3c] hover:text-[#e74c3c] hover:bg-[rgba(231,76,60,0.1)] cursor-pointer">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      {/* How It Works Section */}
      <Card className="p-3 sm:p-5">
        <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
          HOW IT WORKS
        </h3>
        <div className="space-y-2 sm:space-y-3 text-[#a0a0a0] text-xs sm:text-sm">
          <p>
            <span className="text-[#d4af37] font-semibold">1.</span> The library is your list of habits. Adding a habit here does not start tracking it.
          </p>
          <p>
            <span className="text-[#d4af37] font-semibold">2.</span> Use "Add to current month" to include a habit in this month's grid.
          </p>
          <p>
            <span className="text-[#d4af37] font-semibold">3.</span> Archive habits you no longer want to see, but keep their history.
          </p>
        </div>
      </Card>
    </div>
  )
}
