'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Star, Plus, Loader2, X as XIcon } from 'lucide-react'
import { useTranslations, useI18n } from '@/providers/i18n-provider'
import { getHabitName } from '@/lib/habit-name'
import { CircularGauge } from '@/components/ui/tachometer-gauge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHabits, useHabitLogs } from '@/hooks'
import { toast } from 'sonner'


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
  const { locale } = useI18n()
  const [today] = useState(() => new Date())
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const daysScrollRef = useRef<HTMLDivElement>(null)
  const todayColRef = useRef<HTMLDivElement>(null)

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

  // Selected habits in the add modal
  const [selectedHabitIds, setSelectedHabitIds] = useState<Set<string>>(new Set())
  const [isAdding, setIsAdding] = useState(false)

  const toggleHabitSelection = (id: string) => {
    setSelectedHabitIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddSelected = async () => {
    if (selectedHabitIds.size === 0) return
    setIsAdding(true)
    try {
      for (const id of selectedHabitIds) {
        await addToMonth({ id, year: selectedYear, month: selectedMonth })
      }
      toast.success(`${selectedHabitIds.size} ${t.common.habitsAdded}`)
      setSelectedHabitIds(new Set())
      setIsAddModalOpen(false)
    } catch (error) {
      toast.error(t.messages.failedAddToMonth)
    } finally {
      setIsAdding(false)
    }
  }

  const handleOpenAddModal = () => {
    setSelectedHabitIds(new Set())
    setIsAddModalOpen(true)
  }

  // Generate year options (current year +/- 2 years)
  const yearOptions = useMemo(() => {
    const currentYear = today.getFullYear()
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
  }, [today])

  const isLoading = habitsLoading || logsLoading

  // Auto-detect which week today falls in (for mobile weekly view)
  const currentWeekIndex = useMemo(() => {
    const todayDay = today.getDate()
    const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1
    if (!isCurrentMonth) return 1
    for (let i = 0; i < weeks.length; i++) {
      if (weeks[i].days.some(d => d.dayOfMonth === todayDay)) return i + 1
    }
    return 1
  }, [weeks, selectedYear, selectedMonth, today])

  const [activeWeek, setActiveWeek] = useState(currentWeekIndex)

  useEffect(() => {
    setActiveWeek(currentWeekIndex)
  }, [currentWeekIndex])

  const activeWeekData = weeks[activeWeek - 1] || { days: [] }

  // Auto-scroll to today column on desktop mount
  useEffect(() => {
    if (!isLoading && todayColRef.current && daysScrollRef.current) {
      const container = daysScrollRef.current
      const col = todayColRef.current
      const scrollLeft = col.offsetLeft - container.offsetWidth / 2 + col.offsetWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [isLoading, selectedYear, selectedMonth])

  // Render a day cell (shared between mobile and desktop)
  const renderDayCell = (habitId: string, dayNum: number, key: number | string) => {
    const dateStr = formatDate(selectedYear, selectedMonth, dayNum)
    const completed = isCompleted(habitId, dateStr)
    const cellDate = new Date(selectedYear, selectedMonth - 1, dayNum)
    const todayDate2 = new Date()
    todayDate2.setHours(0, 0, 0, 0)
    cellDate.setHours(0, 0, 0, 0)
    const isCellToday = cellDate.getTime() === todayDate2.getTime()
    const isCellPast = cellDate.getTime() < todayDate2.getTime()
    const isCellFuture = cellDate.getTime() > todayDate2.getTime()

    return (
      <div key={key} className="flex justify-center items-center">
        {isCellPast && completed && (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 border-[#d4af37]/40 bg-[rgba(212,175,55,0.1)] flex items-center justify-center">
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#d4af37]" />
          </div>
        )}
        {isCellPast && !completed && (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 border-[#d4af37]/20 flex items-center justify-center">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{
              background: 'radial-gradient(circle, #ff4444 0%, #cc0000 70%)',
              boxShadow: '0 0 4px rgba(255,68,68,0.5)',
            }} />
          </div>
        )}
        {isCellFuture && (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 border-[#d4af37]/15" />
        )}
        {isCellToday && (
          <button
            onClick={() => handleToggle(habitId, dateStr)}
            disabled={isToggling}
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 ${
              completed
                ? 'border-[#d4af37] bg-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                : 'bg-transparent border-[#d4af37]/50 hover:border-[#d4af37] hover:bg-[rgba(212,175,55,0.05)]'
            }`}
          >
            {completed && <Check className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3] text-[#0a0a0a]" />}
          </button>
        )}
      </div>
    )
  }

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
          {habitsInMonth.length} {t.common.habits} x {daysInMonth} {t.common.days} · <span className="text-[#d4af37]">{t.common.week} 1 – {weeks.length}</span>
        </p>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="gold-outline"
            size="sm"
            className="text-xs sm:text-sm"
            onClick={handleOpenAddModal}
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
            onClick={handleOpenAddModal}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.common.addHabitsFromLibrary}
          </Button>
        </Card>
      )}

      {/* ===== MOBILE: Week tabs + weekly grid (sm:hidden) ===== */}
      {!isLoading && habitsInMonth.length > 0 && (
        <div className="sm:hidden space-y-3">
          {/* Week Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-4 px-4">
            {weeks.map((weekData) => (
              <button
                key={weekData.week}
                onClick={() => setActiveWeek(weekData.week)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  activeWeek === weekData.week
                    ? 'bg-[rgba(212,175,55,0.15)] border-[#d4af37] text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                    : 'bg-transparent border-[#2a2a2a] text-[#a0a0a0] hover:border-[#3a3a3a] hover:text-[#f5f5f5]'
                }`}
              >
                W{weekData.week}
              </button>
            ))}
          </div>

          {/* Weekly Grid — same as original */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Header */}
                <div className="grid grid-cols-[minmax(160px,max-content)_repeat(7,40px)] gap-1 items-center py-2 px-3 border-b border-[rgba(212,175,55,0.15)] bg-[rgba(0,0,0,0.3)]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#707070]">
                    {t.monthly.habit}
                  </div>
                  {activeWeekData.days.map((day, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[10px] text-[#707070] uppercase">{t.monthly.weekDaysShort[i]}</div>
                      <div className="text-xs text-[#f5f5f5] font-medium">
                        {day.dayOfMonth > 0 ? day.dayOfMonth : '-'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {habitsInMonth.map((habit) => (
                  <div
                    key={habit.id}
                    className="grid grid-cols-[minmax(160px,max-content)_repeat(7,40px)] gap-1 items-center py-2 px-3 border-b border-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.03)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {habit.emoji ? (
                        <span className="text-sm">{habit.emoji}</span>
                      ) : (
                        <Star className="w-3 h-3 text-[#d4af37] flex-shrink-0" />
                      )}
                      <span className="text-xs text-[#f5f5f5] font-medium">
                        {getHabitName(habit, locale, t)}
                      </span>
                    </div>
                    {activeWeekData.days.map((day, dayIndex) => {
                      if (day.dayOfMonth === 0) {
                        return <div key={dayIndex} className="flex justify-center"><div className="w-6 h-6" /></div>
                      }
                      return renderDayCell(habit.id, day.dayOfMonth, dayIndex)
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===== DESKTOP: Full month grid with sticky names (hidden sm:block) ===== */}
      {!isLoading && habitsInMonth.length > 0 && (
        <Card className="overflow-hidden p-0 hidden sm:block">
          <div className="flex">
            {/* Sticky habit names column */}
            <div className="flex-shrink-0 z-10 bg-[#141414] border-r border-[rgba(212,175,55,0.1)]">
              <div className="h-14 flex items-center px-4 border-b border-[rgba(212,175,55,0.15)] bg-[rgba(0,0,0,0.3)]">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#707070]">
                  {t.monthly.habit}
                </span>
              </div>
              {habitsInMonth.map((habit) => (
                <div key={habit.id} className="h-12 flex items-center gap-3 px-4 border-b border-[rgba(212,175,55,0.08)]">
                  {habit.emoji ? (
                    <span className="text-base flex-shrink-0">{habit.emoji}</span>
                  ) : (
                    <Star className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  )}
                  <span className="text-sm text-[#f5f5f5] font-medium whitespace-nowrap">
                    {getHabitName(habit, locale, t)}
                  </span>
                </div>
              ))}
            </div>

            {/* Scrollable days grid */}
            <div className="overflow-x-auto flex-1 scroll-smooth" ref={daysScrollRef}>
              <div className="flex border-b border-[rgba(212,175,55,0.15)] bg-[rgba(0,0,0,0.3)]" style={{ width: `${daysInMonth * 40}px` }}>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                  const dayDate = new Date(selectedYear, selectedMonth - 1, dayNum)
                  const dayOfWeek = dayDate.getDay()
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                  const isTodayCol = selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1 && dayNum === today.getDate()
                  return (
                    <div key={dayNum} ref={isTodayCol ? todayColRef : undefined}
                      className={`w-10 flex-shrink-0 h-14 flex flex-col items-center justify-center ${isTodayCol ? 'bg-[rgba(212,175,55,0.1)]' : ''}`}>
                      <span className={`text-[9px] uppercase ${isWeekend ? 'text-[#505050]' : 'text-[#707070]'}`}>
                        {t.monthly.weekDaysShort[dayOfWeek]}
                      </span>
                      <span className={`text-sm font-medium ${isTodayCol ? 'text-[#d4af37] font-bold' : 'text-[#f5f5f5]'}`}>
                        {dayNum}
                      </span>
                    </div>
                  )
                })}
              </div>

              {habitsInMonth.map((habit) => (
                <div key={habit.id} className="flex border-b border-[rgba(212,175,55,0.08)]" style={{ width: `${daysInMonth * 40}px` }}>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                    const isTodayCol = selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1 && dayNum === today.getDate()
                    return (
                      <div key={dayNum} className={`w-10 flex-shrink-0 h-12 flex items-center justify-center ${isTodayCol ? 'bg-[rgba(212,175,55,0.05)]' : ''}`}>
                        {renderDayCell(habit.id, dayNum, dayNum)}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Analysis Section - Circular Gauges 2 per row */}
      {!isLoading && habitsInMonth.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            {t.monthly.analysis}
          </h2>

          <Card className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {habitsInMonth.map((habit) => {
                const completedCount = getCompletionCount(habit.id)
                const percentage = Math.round((completedCount / daysInMonth) * 100)
                return (
                  <div key={habit.id} className="flex flex-col items-center text-center">
                    <CircularGauge
                      percentage={percentage}
                      size={90}
                    />
                    <div className="mt-2">
                      <span className="text-xs sm:text-sm text-[#f5f5f5] font-medium flex items-center justify-center gap-1">
                        {habit.emoji && <span>{habit.emoji}</span>}
                        {getHabitName(habit, locale, t)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-[#707070] block mt-0.5">
                        {completedCount}/{daysInMonth} {t.common.done}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Add Habit from Library Popup */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setIsAddModalOpen(false); setSelectedHabitIds(new Set()) }}
          />
          {/* Modal */}
          <div className="relative w-full sm:max-w-md glass-card sm:rounded-2xl rounded-t-2xl border border-[rgba(212,175,55,0.2)] flex flex-col max-h-[85vh] sm:max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[rgba(212,175,55,0.1)]">
              <div>
                <h3 className="text-lg font-semibold text-[#f5f5f5]">
                  {t.common.addHabitsFromLibrary}
                </h3>
                <p className="text-xs text-[#707070] mt-0.5">
                  {t.monthly.months[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setSelectedHabitIds(new Set()) }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#707070] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {habitsNotInMonth.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#707070] text-sm">{t.common.allHabitsAdded}</p>
                  <p className="text-[#505050] text-xs mt-1">{t.common.createNewInLibrary}</p>
                </div>
              ) : (
                habitsNotInMonth.map((habit) => {
                  const isSelected = selectedHabitIds.has(habit.id)
                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabitSelection(habit.id)}
                      className={`
                        w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left
                        ${isSelected
                          ? 'bg-[rgba(212,175,55,0.1)] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                          : 'border-[rgba(212,175,55,0.08)] hover:border-[rgba(212,175,55,0.25)] hover:bg-[rgba(255,255,255,0.02)]'
                        }
                      `}
                    >
                      {/* Checkbox */}
                      <div className={`
                        w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${isSelected
                          ? 'bg-[#d4af37] border-[#d4af37]'
                          : 'border-[#3a3a3a]'
                        }
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-[#0a0a0a] stroke-[3]" />}
                      </div>
                      {/* Habit info */}
                      {habit.emoji ? (
                        <span className="text-lg flex-shrink-0">{habit.emoji}</span>
                      ) : (
                        <Star className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-[#f5f5f5] font-medium truncate">{getHabitName(habit, locale, t)}</span>
                        {habit.category && (
                          <span className="text-[10px] text-[#707070] uppercase tracking-wider">{habit.category}</span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer with confirm button */}
            {habitsNotInMonth.length > 0 && (
              <div className="p-4 border-t border-[rgba(212,175,55,0.1)]">
                <Button
                  variant="luxury"
                  className="w-full h-12 text-base rounded-xl"
                  onClick={handleAddSelected}
                  disabled={selectedHabitIds.size === 0 || isAdding}
                >
                  {isAdding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : selectedHabitIds.size === 0 ? (
                    t.common.selectHabitsToAdd
                  ) : (
                    t.common.addCount.replace('{count}', String(selectedHabitIds.size))
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
