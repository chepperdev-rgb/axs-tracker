'use client'

import { useState, useMemo, useRef, KeyboardEvent } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, Plus, Loader2, Trash2, X as XIcon, Check, Trophy, TrendingUp, AlertTriangle } from 'lucide-react'
import {
  useTasks,
  getWeekStart,
  formatWeekRange,
  getDateForDay,
  isToday,
  isPast,
  isFuture,
} from '@/hooks/useTasks'
import { Task } from '@/db/schema'
import { useTranslations } from '@/providers/i18n-provider'

export default function PlannerPage() {
  const t = useTranslations()
  const weekDays = [t.planner.weekDays.mon, t.planner.weekDays.tue, t.planner.weekDays.wed, t.planner.weekDays.thu, t.planner.weekDays.fri, t.planner.weekDays.sat, t.planner.weekDays.sun]
  const weekDaysShort = [t.planner.weekDaysShort.mon, t.planner.weekDaysShort.tue, t.planner.weekDaysShort.wed, t.planner.weekDaysShort.thu, t.planner.weekDaysShort.fri, t.planner.weekDaysShort.sat, t.planner.weekDaysShort.sun]
  const [weekStart, setWeekStart] = useState(() => getWeekStart())
  const [addingTaskForDay, setAddingTaskForDay] = useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const escapePressedRef = useRef(false)
  const [dayPopup, setDayPopup] = useState<{ date: string; dayName: string } | null>(null)

  const { tasks, isLoading, createTask, updateTask, deleteTask, isCreating } =
    useTasks(weekStart)

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach((task) => {
      const date = typeof task.date === 'string' ? task.date : task.date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(task)
    })
    // Sort tasks within each day by sortOrder then createdAt
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return aTime - bTime
      })
    })
    return grouped
  }, [tasks])

  // Calculate week stats
  const weekStats = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.completed).length
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    return { total: totalTasks, completed: completedTasks, percentage }
  }, [tasks])

  // Calculate today stats
  const todayStats = useMemo(() => {
    const now = new Date()
    const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const todayTasks = tasks.filter((t) => {
      const taskDate = typeof t.date === 'string' ? t.date : t.date
      return taskDate === todayDate
    })
    const total = todayTasks.length
    const completed = todayTasks.filter((t) => t.completed).length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, percentage }
  }, [tasks])

  const year = new Date(weekStart).getFullYear()
  const weekRange = formatWeekRange(weekStart)

  const goToPreviousWeek = () => {
    const prev = new Date(weekStart)
    prev.setDate(prev.getDate() - 7)
    setWeekStart(prev.toISOString().split('T')[0])
  }

  const goToNextWeek = () => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + 7)
    setWeekStart(next.toISOString().split('T')[0])
  }

  const handleAddTaskClick = (dayIndex: number) => {
    setAddingTaskForDay(dayIndex)
    setNewTaskTitle('')
  }

  const handleCreateTask = (dayIndex: number) => {
    if (!newTaskTitle.trim()) {
      setAddingTaskForDay(null)
      return
    }

    const date = getDateForDay(weekStart, dayIndex)
    createTask(
      { title: newTaskTitle.trim(), date },
      {
        onSuccess: () => {
          setNewTaskTitle('')
          setAddingTaskForDay(null)
        },
      }
    )
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, dayIndex: number) => {
    if (e.key === 'Enter') {
      handleCreateTask(dayIndex)
    } else if (e.key === 'Escape') {
      escapePressedRef.current = true
      setAddingTaskForDay(null)
      setNewTaskTitle('')
    }
  }

  const handleBlur = (dayIndex: number) => {
    if (escapePressedRef.current) {
      escapePressedRef.current = false
      return
    }
    handleCreateTask(dayIndex)
  }

  const handleToggleComplete = (task: Task) => {
    const taskDate = typeof task.date === 'string' ? task.date : task.date
    if (!isToday(taskDate)) return
    updateTask({ id: task.id, completed: !task.completed })
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId)
  }

  // Calculate stroke dashoffset for donut charts
  const circumference = 2 * Math.PI * 40 // r=40
  const weeklyOffset = circumference - (weekStats.percentage / 100) * circumference
  const todayOffset = circumference - (todayStats.percentage / 100) * circumference

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            {t.planner.title}
          </h1>
          <p className="text-base sm:text-lg text-gold-gradient mt-1">{t.planner.subtitle}</p>
        </div>

        <Button
          variant="glass"
          size="sm"
          className="self-start sm:self-auto text-xs sm:text-sm"
          onClick={() => setWeekStart(getWeekStart())}
        >
          {t.common.today}
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 order-2 sm:order-1">
          <Button variant="glass" size="sm" className="text-xs" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.common.prev}</span>
          </Button>
          <Button variant="glass" size="sm" className="text-xs" onClick={goToNextWeek}>
            <span className="hidden sm:inline">{t.common.next}</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        <div className="text-base sm:text-lg font-medium text-[#f5f5f5] order-1 sm:order-2">
          {weekRange}
        </div>

        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass-card rounded-lg order-3 self-start sm:self-auto">
          <span className="text-sm sm:text-base text-[#f5f5f5] font-medium">{year}</span>
        </div>
      </div>

      {/* Week Progress */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            WEEK:{' '}
            <span className="text-[#d4af37] gold-glow">
              {weekStats.completed}/{weekStats.total}
            </span>
          </span>
          <span className="text-[10px] sm:text-sm text-[#707070]">{t.common.basedOnCreatedTasks}</span>
        </div>
        <div className="h-1.5 sm:h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#9a8330] via-[#d4af37] to-[#f0d060] rounded-full transition-all shadow-[0_0_10px_rgba(212,175,55,0.4)]"
            style={{ width: `${weekStats.percentage}%` }}
          />
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
        </div>
      )}

      {/* Day Grid - Horizontally scrollable on mobile */}
      {!isLoading && (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 min-w-[700px] sm:min-w-0">
            {weekDays.map((day, index) => {
              const date = getDateForDay(weekStart, index)
              const dayTasks = tasksByDate[date] || []
              const completedCount = dayTasks.filter((t) => t.completed).length
              const totalCount = dayTasks.length
              const percentage =
                totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
              const isTodayDate = isToday(date)
              const isPastDate = isPast(date)
              const isFutureDate = isFuture(date)

              return (
                <Card
                  key={day}
                  onClick={isPastDate ? () => setDayPopup({ date, dayName: day }) : undefined}
                  className={`
                    overflow-hidden p-0
                    ${isTodayDate ? 'border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]' : ''}
                    ${isPastDate ? 'opacity-60 cursor-pointer hover:opacity-80 transition-opacity' : ''}
                  `}
                >
                  {/* Day Header */}
                  <div
                    className={`
                      p-2 sm:p-3 border-b
                      ${isTodayDate ? 'border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.1)]' : 'border-[rgba(212,175,55,0.1)]'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`
                          text-xs sm:text-sm font-semibold uppercase
                          ${isTodayDate ? 'text-[#d4af37] gold-glow' : isPastDate ? 'text-[#505050]' : 'text-[#f5f5f5]'}
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
                        className={`h-full rounded-full transition-all ${
                          isPastDate
                            ? 'bg-[#3a3a3a]'
                            : 'bg-gradient-to-r from-[#d4af37] to-[#f0d060]'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2 min-h-[100px] sm:min-h-[120px]">
                    {dayTasks.length === 0 && addingTaskForDay !== index ? (
                      <p className="text-[10px] sm:text-xs text-[#707070] text-center py-3 sm:py-4">
                        {t.common.noTasks}
                      </p>
                    ) : (
                      dayTasks.map((task) => {
                        // Past: show gray X for incomplete, gray check for completed
                        if (isPastDate) {
                          return (
                            <div
                              key={task.id}
                              className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg"
                            >
                              <div className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 border-[#3a3a3a] flex items-center justify-center flex-shrink-0 bg-[#1c1c1c]">
                                {task.completed ? (
                                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
                                    <path d="M2 6L5 9L10 3" stroke="#505050" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <XIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#505050]" />
                                )}
                              </div>
                              <span className="text-[10px] sm:text-sm leading-tight flex-1 text-[#505050] line-through">
                                {task.title}
                              </span>
                            </div>
                          )
                        }

                        // Today: interactive checkboxes
                        if (isTodayDate) {
                          return (
                            <div
                              key={task.id}
                              className="group flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(212,175,55,0.05)] transition-colors"
                            >
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => handleToggleComplete(task)}
                                className={`
                                  mt-0.5 border-[#2a2a2a] w-3.5 h-3.5 sm:w-4 sm:h-4
                                  data-[state=checked]:bg-[#d4af37]
                                  data-[state=checked]:border-[#d4af37]
                                `}
                              />
                              <span
                                className={`
                                  text-[10px] sm:text-sm leading-tight flex-1
                                  ${task.completed ? 'text-[#707070] line-through' : 'text-[#f5f5f5]'}
                                `}
                              >
                                {task.title}
                              </span>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-[#707070] hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          )
                        }

                        // Future: visible but locked
                        return (
                          <div
                            key={task.id}
                            className="group flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg"
                          >
                            <div className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 border-[#2a2a2a] flex-shrink-0" />
                            <span className="text-[10px] sm:text-sm leading-tight flex-1 text-[#707070]">
                              {task.title}
                            </span>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 text-[#707070] hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        )
                      })
                    )}

                    {/* Add Task Input */}
                    {addingTaskForDay === index && (
                      <div className="flex items-center gap-1.5 p-1.5 sm:p-2">
                        <Input
                          autoFocus
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onBlur={() => handleBlur(index)}
                          placeholder="Task name..."
                          disabled={isCreating}
                          className="h-6 sm:h-7 text-[10px] sm:text-sm bg-transparent border-[rgba(212,175,55,0.2)] focus:border-[#d4af37] px-2"
                        />
                        {isCreating && (
                          <Loader2 className="w-3 h-3 animate-spin text-[#d4af37]" />
                        )}
                      </div>
                    )}

                    {/* Add Task Button — only for today and future */}
                    {addingTaskForDay !== index && !isPastDate && (
                      <button
                        onClick={() => handleAddTaskClick(index)}
                        className="flex items-center gap-1 sm:gap-2 text-[#707070] hover:text-[#d4af37] text-[10px] sm:text-sm transition-colors w-full p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(212,175,55,0.05)]"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{t.common.addTask}</span>
                        <span className="sm:hidden">{t.common.add}</span>
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Past Day Popup */}
      {dayPopup && (() => {
        const popupTasks = tasksByDate[dayPopup.date] || []
        const completedTasks = popupTasks.filter(t => t.completed)
        const incompleteTasks = popupTasks.filter(t => !t.completed)
        const total = popupTasks.length
        const done = completedTasks.length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0

        // Motivational phrase based on completion
        const motivation = pct === 100
          ? 'Perfect day! Every task completed.'
          : pct >= 75
          ? 'Great effort! Almost everything done.'
          : pct >= 50
          ? 'Solid progress. Keep building momentum.'
          : pct > 0
          ? 'Every step counts. Tomorrow is a new chance.'
          : total === 0
          ? 'No tasks were planned for this day.'
          : 'Missed this one. Use it as fuel for today.'

        const MotivIcon = pct === 100 ? Trophy : pct >= 50 ? TrendingUp : AlertTriangle
        const motivColor = pct >= 75 ? '#d4af37' : pct >= 50 ? '#a0a0a0' : '#707070'

        // Format date for display
        const [y, m, d] = dayPopup.date.split('-').map(Number)
        const displayDate = new Date(y, m - 1, d).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric'
        })

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDayPopup(null)} />
            <div className="relative w-full max-w-sm glass-card rounded-2xl border border-[rgba(212,175,55,0.2)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[rgba(212,175,55,0.1)]">
                <div>
                  <h3 className="text-base font-semibold text-[#f5f5f5]">{dayPopup.dayName}</h3>
                  <p className="text-xs text-[#707070] mt-0.5">{displayDate}</p>
                </div>
                <button
                  onClick={() => setDayPopup(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#707070] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="px-5 py-4 border-b border-[rgba(212,175,55,0.1)] flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a2a" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none"
                      stroke={pct >= 75 ? '#d4af37' : pct >= 50 ? '#a0a0a0' : '#3a3a3a'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (pct / 100) * 251.2}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold font-mono" style={{ color: motivColor }}>{pct}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f5] font-medium">{done}/{total} tasks</p>
                  <p className="text-xs text-[#707070] mt-0.5">{done} completed · {total - done} missed</p>
                </div>
              </div>

              {/* Task list */}
              <div className="px-5 py-3 max-h-[200px] overflow-y-auto space-y-1.5">
                {popupTasks.length === 0 ? (
                  <p className="text-sm text-[#505050] text-center py-4">No tasks</p>
                ) : (
                  <>
                    {completedTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 py-1">
                        <div className="w-4 h-4 rounded bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-[#d4af37]" />
                        </div>
                        <span className="text-sm text-[#707070] line-through">{task.title}</span>
                      </div>
                    ))}
                    {incompleteTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 py-1">
                        <div className="w-4 h-4 rounded bg-[#1c1c1c] flex items-center justify-center flex-shrink-0">
                          <XIcon className="w-3 h-3 text-[#3a3a3a]" />
                        </div>
                        <span className="text-sm text-[#505050]">{task.title}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Motivation */}
              <div className="px-5 py-4 border-t border-[rgba(212,175,55,0.1)] flex items-center gap-3">
                <MotivIcon className="w-5 h-5 flex-shrink-0" style={{ color: motivColor }} />
                <p className="text-sm" style={{ color: motivColor }}>{motivation}</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Weekly Analytics */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
          {t.planner.weeklyAnalytics}
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Weekly Completion Donut */}
          <Card className="p-3 sm:p-5">
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4 text-center">
              {t.planner.weekly}
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
                    strokeDasharray={circumference}
                    strokeDashoffset={weeklyOffset}
                    strokeLinecap="round"
                    className="gold-glow transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#f0d060" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg sm:text-2xl font-bold text-[#d4af37] font-mono">
                    {weekStats.percentage}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-[#707070] text-center mt-2 sm:mt-3">
              {weekStats.completed} of {weekStats.total} {t.common.tasks}
            </p>
          </Card>

          {/* Daily Completion Donut */}
          <Card className="p-3 sm:p-5">
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4 text-center">
              {t.common.today.toUpperCase()}
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
                    strokeDasharray={circumference}
                    strokeDashoffset={todayOffset}
                    strokeLinecap="round"
                    className="gold-glow transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="dailyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#f0d060" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg sm:text-2xl font-bold text-[#d4af37] font-mono">
                    {todayStats.percentage}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-[#707070] text-center mt-2 sm:mt-3">
              {todayStats.completed} of {todayStats.total} {t.common.tasks}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
