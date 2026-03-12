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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            HABIT LIBRARY
          </h1>
          <p className="text-lg text-[#f5f5f5] mt-1">
            Manage your habit library. Add to the current month explicitly to track.
          </p>
        </div>
        <div className="px-4 py-2 rounded-full border border-[#2a2a2a] text-[#a0a0a0] text-sm">
          <span className="text-[#d4af37] font-semibold">{mockHabits.length}</span> ACTIVE
        </div>
      </div>

      {/* Add Habit Form */}
      <Card className="bg-[#141414] border-[#2a2a2a] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4">
          ADD TO LIBRARY
        </h3>
        <div className="flex gap-3">
          <Input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Evening shutdown routine"
            className="flex-1 bg-[#1c1c1c] border-[#2a2a2a] text-[#f5f5f5] placeholder:text-[#707070] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
          />
          <Button className="bg-[#d4af37] text-black hover:bg-[#f0d060] font-semibold px-6">
            SAVE TO LIBRARY
          </Button>
        </div>
      </Card>

      {/* Habit List */}
      <div className="space-y-2">
        {mockHabits.map((habit) => (
          <Card
            key={habit.id}
            className="bg-[#141414] border-[#2a2a2a] p-4 flex items-center justify-between hover:border-[#3a3a3a] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-[#d4af37]" />
              <span className="text-[#f5f5f5] font-medium">{habit.name}</span>
            </div>

            <div className="flex items-center gap-2">
              {habit.inCurrentMonth ? (
                <span className="px-3 py-1 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-xs font-medium">
                  IN CURRENT MONTH
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Add to Month
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#707070] hover:text-[#f5f5f5] hover:bg-[#2a2a2a]"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl"
                >
                  <DropdownMenuItem className="text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] cursor-pointer">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[#e74c3c] hover:text-[#e74c3c] hover:bg-[#2a2a2a] cursor-pointer">
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
      <Card className="bg-[#141414] border-[#2a2a2a] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4">
          HOW IT WORKS
        </h3>
        <div className="space-y-3 text-[#a0a0a0] text-sm">
          <p>
            <span className="text-[#d4af37]">1.</span> The library is your list of habits. Adding a habit here does not start tracking it.
          </p>
          <p>
            <span className="text-[#d4af37]">2.</span> Use "Add to current month" to include a habit in this month's grid. On the Monthly page you can add from library or remove.
          </p>
          <p>
            <span className="text-[#d4af37]">3.</span> Archive habits you no longer want to see, but keep their history.
          </p>
        </div>
      </Card>
    </div>
  )
}
