'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Star, Plus, Loader2 } from 'lucide-react'
import { useTranslations } from '@/providers/i18n-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useHabits, useHabitLogs } from '@/hooks'


// Get weeks for a given month
function getWeeksForMonth(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()

  const weeks: { week: number; days: { date: Date; dayOfMonth: number }[] }[] = []
  let currentWeek: { date: Date; dayOfMonth: number }[] = []
  let weekNumber = 1

  // Add empty days for the first week if month doesn't start on Sunday
  const firstDayOfWeek = firstDay.getDay()
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: new Date(0), dayOfMonth: 0 })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    currentWeek.push({ date, dayOfMonth: day })

    if (date.getDay() === 6 || day === daysInMonth) {
      // Fill remaining days of the last week
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), dayOfMonth: 0 })
      }
      weeks.push({ week: weekNumber, days: currentWeek })
      currentWeek = []
      weekNumber++
    }
  }

  return weeks
}

// Format date as YYYY-MM-DD
function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function MonthlyPage() {
  const t = useTranslations()
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [activeWeek, setActiveWeek] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Month string for API
  const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`

  // Fetch habits (all habits to show in modal, filtered by month for grid)
  const { habits: allHabits, isLoading: habitsLoading, addToMonth, isAddingToMonth } = useHabits({
    year: selectedYear,
    month: selectedMonth,
  })

  // Fetch habit logs for the selected month
  const { logs, isLoading: logsLoading, toggleLog, isToggling, isCompleted, getCompletionCount } = useHabitLogs(monthString)

  // Get habits that are in the current month
  const habitsInMonth = useMemo(() => {
    return allHabits.filter(h => h.inCurrentMonth)
  }, [allHabits])

  // Get habits not in the current month (for the add modal)
  const habitsNotInMonth = useMemo(() => {
    return allHabits.filter(h => !h.inCurrentMonth)
  }, [allHabits])

  // Calculate weeks for the selected month
  const weeks = useMemo(() => {
    return getWeeksForMonth(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  // Get days for the active week
  const activeWeekData = weeks[activeWeek - 1] || { days: [] }

  // Calculate days in month for percentage calculations
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()

  // Calculate overall month completion percentage
  const overallCompletion = useMemo(() => {
    if (habitsInMonth.length === 0) return 0
    const totalPossible = habitsInMonth.length * daysInMonth
    const totalCompleted = logs.length
    return Math.round((totalCompleted / totalPossible) * 100)
  }, [habitsInMonth.length, daysInMonth, logs.length])

  // Handle checkbox click
  const handleToggle = (habitId: string, date: string) => {
    toggleLog({ habitId, date })
  }

  // Handle adding habit to month
  const handleAddToMonth = async (habitId: string) => {
    try {
      await addToMonth({ id: habitId, year: selectedYear, month: selectedMonth })
      setIsAddModalOpen(false)
    } catch (error) {
      console.error('Failed to add habit to month:', error)
    }
  }

  // Generate year options (current year +/- 2 years)
  const yearOptions = useMemo(() => {
    const currentYear = today.getFullYear()
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
  }, [today])

  const isLoading = habitsLoading || logsLoading

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            {t.monthly.title}
          </h1>
          <p className="text-base sm:text-lg text-gold-gradient mt-1">
            {t.monthly.subtitle}
          </p>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-[#707070]">{t.common.month.toUpperCase()}</span>
            <Select
              value={String(selectedMonth)}
              onValueChange={(value) => {
                setSelectedMonth(parseInt(value))
                setActiveWeek(1)
              }}
            >
              <SelectTrigger className="w-[120px] sm:w-[140px] glass-card border-[rgba(212,175,55,0.15)] text-[#f5f5f5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-[rgba(212,175,55,0.15)]">
                {t.monthly.months.map((month: string, index: number) => (
                  <SelectItem
                    key={index}
                    value={String(index + 1)}
                    className="text-[#f5f5f5] hover:bg-[rgba(212,175,55,0.1)] focus:bg-[rgba(212,175,55,0.1)]"
                  >
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-[#707070]">{t.common.year.toUpperCase()}</span>
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => {
                setSelectedYear(parseInt(value))
                setActiveWeek(1)
              }}
            >
              <SelectTrigger className="w-[90px] sm:w-[100px] glass-card border-[rgba(212,175,55,0.15)] text-[#f5f5f5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-[rgba(212,175,55,0.15)]">
                {yearOptions.map((year) => (
                  <SelectItem
                    key={year}
                    value={String(year)}
                    className="text-[#f5f5f5] hover:bg-[rgba(212,175,55,0.1)] focus:bg-[rgba(212,175,55,0.1)]"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <p className="text-xs sm:text-sm text-[#a0a0a0]">
          {habitsInMonth.length} habit{habitsInMonth.length !== 1 ? 's' : ''} x {daysInMonth} days · <span className="text-[#d4af37]">{t.common.week} 1 – {weeks.length}</span>
        </p>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="gold-outline"
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.monthly.addFromLibrary}</span>
            <span className="sm:hidden">{t.common.add.toUpperCase()}</span>
          </Button>
          <span className="text-xs sm:text-sm text-[#a0a0a0]">
            {t.common.month} <span className="text-[#d4af37] gold-glow">{overallCompletion}%</span>
          </span>
        </div>
      </div>

      {/* Week Tabs - Scrollable on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {weeks.map((weekData) => (
          <button
            key={weekData.week}
            onClick={() => setActiveWeek(weekData.week)}
            className={`
              px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0
              ${activeWeek === weekData.week
                ? 'bg-[rgba(212,175,55,0.15)] border-[#d4af37] text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                : 'bg-transparent border-[#2a2a2a] text-[#a0a0a0] hover:border-[#3a3a3a] hover:text-[#f5f5f5]'
              }
            `}
          >
            <span className="sm:hidden">W{weekData.week}</span>
            <span className="hidden sm:inline">{t.common.week} {weekData.week}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
          <span className="ml-2 text-[#a0a0a0]">{t.common.loadingHabits}</span>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && habitsInMonth.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-[#a0a0a0] mb-4">{t.common.noHabitsInMonth}</p>
          <Button
            variant="luxury"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.common.addHabitsFromLibrary}
          </Button>
        </Card>
      )}

      {/* Habit Grid - Horizontally scrollable on mobile */}
      {!isLoading && habitsInMonth.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Grid Header */}
              <div className="grid grid-cols-[minmax(120px,150px)_repeat(7,1fr)] sm:grid-cols-[200px_repeat(7,1fr)] gap-1 sm:gap-2 items-center py-2 sm:py-3 px-3 sm:px-4 border-b border-[rgba(212,175,55,0.15)] bg-[rgba(0,0,0,0.3)]">
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#707070]">
                  {t.monthly.habit}
                </div>
                {activeWeekData.days.map((day, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[10px] sm:text-xs text-[#707070] uppercase">
                      <span className="sm:hidden">{t.monthly.weekDaysShort[i]}</span>
                      <span className="hidden sm:inline">{t.monthly.weekDays[i]}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-[#f5f5f5] font-medium">
                      {day.dayOfMonth > 0 ? day.dayOfMonth : '-'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Rows */}
              {habitsInMonth.map((habit) => (
                <div
                  key={habit.id}
                  className="grid grid-cols-[minmax(120px,150px)_repeat(7,1fr)] sm:grid-cols-[200px_repeat(7,1fr)] gap-1 sm:gap-2 items-center py-2 sm:py-3 px-3 sm:px-4 border-b border-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.03)] transition-colors"
                >
                  {/* Habit Name */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {habit.emoji ? (
                      <span className="text-sm sm:text-base">{habit.emoji}</span>
                    ) : (
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#d4af37] flex-shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm text-[#f5f5f5] font-medium truncate">
                      {habit.name}
                    </span>
                  </div>

                  {/* Day Checkboxes */}
                  {activeWeekData.days.map((day, dayIndex) => {
                    if (day.dayOfMonth === 0) {
                      // Empty cell for days outside the month
                      return (
                        <div key={dayIndex} className="flex justify-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                      )
                    }

                    const dateStr = formatDate(selectedYear, selectedMonth, day.dayOfMonth)
                    const completed = isCompleted(habit.id, dateStr)

                    return (
                      <div key={dayIndex} className="flex justify-center">
                        <button
                          onClick={() => handleToggle(habit.id, dateStr)}
                          disabled={isToggling}
                          className={`
                            w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border-2 flex items-center justify-center
                            transition-all duration-200 active:scale-95 disabled:opacity-50
                            ${completed
                              ? 'btn-luxury border-transparent shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                              : 'bg-transparent border-[#2a2a2a] hover:border-[rgba(212,175,55,0.3)] hover:bg-[rgba(212,175,55,0.05)]'
                            }
                          `}
                        >
                          {completed && <Check className="w-3 h-3 sm:w-5 sm:h-5 stroke-[3] text-black" />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Analysis Section */}
      {!isLoading && habitsInMonth.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            {t.monthly.analysis}
          </h2>

          <div className="space-y-3">
            {habitsInMonth.map((habit) => {
              const completedCount = getCompletionCount(habit.id)
              const percentage = Math.round((completedCount / daysInMonth) * 100)
              return (
                <Card key={habit.id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 mb-2">
                    <span className="text-xs sm:text-sm text-[#f5f5f5] font-medium flex items-center gap-2">
                      {habit.emoji && <span>{habit.emoji}</span>}
                      {habit.name}
                    </span>
                    <span className="text-[10px] sm:text-sm text-[#a0a0a0]">
                      {t.monthly.goal} {daysInMonth} · <span className="text-[#d4af37]">{completedCount} {t.common.done}</span>
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
      )}

      {/* Add Habit from Library Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="glass-card border-[rgba(212,175,55,0.15)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#f5f5f5]">{t.common.addHabitsFromLibrary} - {t.monthly.months[selectedMonth - 1]} {selectedYear}</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              {t.habits.step2}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {habitsNotInMonth.length === 0 ? (
              <p className="text-[#a0a0a0] text-center py-4">
                {t.habits.step1}
              </p>
            ) : (
              habitsNotInMonth.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[rgba(212,175,55,0.1)] hover:border-[rgba(212,175,55,0.3)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {habit.emoji ? (
                      <span className="text-base">{habit.emoji}</span>
                    ) : (
                      <Star className="w-4 h-4 text-[#d4af37]" />
                    )}
                    <span className="text-sm text-[#f5f5f5]">{habit.name}</span>
                  </div>
                  <Button
                    variant="gold-outline"
                    size="sm"
                    onClick={() => handleAddToMonth(habit.id)}
                    disabled={isAddingToMonth}
                  >
                    {isAddingToMonth ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
