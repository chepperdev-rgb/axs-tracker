'use client'

import { useState, useMemo, useRef, useEffect, KeyboardEvent } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Plus, Loader2, Trash2, X as XIcon, Check, Trophy, TrendingUp, AlertTriangle, Pencil, ArrowRight } from 'lucide-react'
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
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set())
  const [editingTask, setEditingTask] = useState<{ id: string; title: string } | null>(null)
  const todayCardRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showUnfinishedPopup, setShowUnfinishedPopup] = useState(false)
  const [unfinishedTasks, setUnfinishedTasks] = useState<Task[]>([])
  const [processingUnfinished, setProcessingUnfinished] = useState(false)

  const { tasks, isLoading, createTask, updateTask, deleteTask, isCreating } =
    useTasks(weekStart)

  // Auto-scroll to today on mount
  useEffect(() => {
    if (!isLoading && todayCardRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const card = todayCardRef.current
      const scrollLeft = card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [isLoading, weekStart])

  // Check for unfinished tasks from past days (in this week)
  useEffect(() => {
    if (isLoading || tasks.length === 0) return
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const pastIncomplete = tasks.filter(task => {
      const taskDate = typeof task.date === 'string' ? task.date : task.date
      return taskDate < todayStr && !task.completed
    })

    if (pastIncomplete.length > 0) {
      setUnfinishedTasks(pastIncomplete)
      setShowUnfinishedPopup(true)
    }
  }, [isLoading, tasks])

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach((task) => {
      const date = typeof task.date === 'string' ? task.date : task.date
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(task)
    })
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

  const weekStats = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.completed).length
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    return { total: totalTasks, completed: completedTasks, percentage }
  }, [tasks])

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
    const y = prev.getFullYear(), m = String(prev.getMonth() + 1).padStart(2, '0'), d = String(prev.getDate()).padStart(2, '0')
    setWeekStart(`${y}-${m}-${d}`)
  }

  const goToNextWeek = () => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + 7)
    const y = next.getFullYear(), m = String(next.getMonth() + 1).padStart(2, '0'), d = String(next.getDate()).padStart(2, '0')
    setWeekStart(`${y}-${m}-${d}`)
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
      { onSuccess: () => { setNewTaskTitle(''); setAddingTaskForDay(null) } }
    )
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, dayIndex: number) => {
    if (e.key === 'Enter') handleCreateTask(dayIndex)
    else if (e.key === 'Escape') {
      escapePressedRef.current = true
      setAddingTaskForDay(null)
      setNewTaskTitle('')
    }
  }

  const handleBlur = (dayIndex: number) => {
    if (escapePressedRef.current) { escapePressedRef.current = false; return }
    handleCreateTask(dayIndex)
  }

  const handleToggleComplete = (task: Task) => {
    const taskDate = typeof task.date === 'string' ? task.date : task.date
    if (!isToday(taskDate)) return
    updateTask({ id: task.id, completed: !task.completed })
  }

  const handleDeleteTask = (taskId: string) => deleteTask(taskId)

  // Get tomorrow's date string
  const getTomorrowStr = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  }

  const handleMoveToTomorrow = async (taskId: string) => {
    setProcessingUnfinished(true)
    const tomorrow = getTomorrowStr()
    // Create new task for tomorrow with same title, delete old one
    const task = unfinishedTasks.find(t => t.id === taskId)
    if (task) {
      createTask({ title: task.title, date: tomorrow }, {
        onSuccess: () => {
          deleteTask(taskId)
          setUnfinishedTasks(prev => prev.filter(t => t.id !== taskId))
          setProcessingUnfinished(false)
        }
      })
    }
  }

  const handleDeleteUnfinished = (taskId: string) => {
    deleteTask(taskId)
    setUnfinishedTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleMoveAllToTomorrow = () => {
    const tomorrow = getTomorrowStr()
    setProcessingUnfinished(true)
    unfinishedTasks.forEach(task => {
      createTask({ title: task.title, date: tomorrow }, {
        onSuccess: () => deleteTask(task.id)
      })
    })
    setUnfinishedTasks([])
    setShowUnfinishedPopup(false)
    setProcessingUnfinished(false)
  }

  const handleDeleteAllUnfinished = () => {
    unfinishedTasks.forEach(task => deleteTask(task.id))
    setUnfinishedTasks([])
    setShowUnfinishedPopup(false)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask({ id: task.id, title: task.title })
  }

  const handleSaveEdit = () => {
    if (!editingTask || !editingTask.title.trim()) {
      setEditingTask(null)
      return
    }
    updateTask({ id: editingTask.id, title: editingTask.title.trim() })
    setEditingTask(null)
  }

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveEdit()
    else if (e.key === 'Escape') setEditingTask(null)
  }

  const circumference = 2 * Math.PI * 40
  const weeklyOffset = circumference - (weekStats.percentage / 100) * circumference
  const todayOffset = circumference - (todayStats.percentage / 100) * circumference

  const toggleDayCollapse = (index: number) => {
    setCollapsedDays(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // Open day detail (any day, not just past)
  const openDayDetail = (date: string, dayName: string) => {
    setDayPopup({ date, dayName })
  }

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
        <div className="text-base sm:text-lg font-medium text-[#f5f5f5] order-1 sm:order-2">{weekRange}</div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass-card rounded-lg order-3 self-start sm:self-auto">
          <span className="text-sm sm:text-base text-[#f5f5f5] font-medium">{year}</span>
        </div>
      </div>

      {/* Week Progress */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            {t.common.week}: <span className="text-[#d4af37] gold-glow">{weekStats.completed}/{weekStats.total}</span>
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

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
        </div>
      )}

      {/* Day Grid — scrollable, today centered */}
      {!isLoading && (
        <div ref={scrollContainerRef} className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 scroll-smooth">
          <div className="flex gap-3 sm:gap-4" style={{ minWidth: 'max-content' }}>
            {weekDays.map((day, index) => {
              const date = getDateForDay(weekStart, index)
              const dayTasks = tasksByDate[date] || []
              const completedCount = dayTasks.filter((t) => t.completed).length
              const totalCount = dayTasks.length
              const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
              const isTodayDate = isToday(date)
              const isPastDate = isPast(date)

              return (
                <div
                  key={day}
                  ref={isTodayDate ? todayCardRef : undefined}
                  className="flex-shrink-0"
                  style={{ width: 'clamp(200px, 28vw, 280px)' }}
                >
                  <Card
                    className={`
                      overflow-hidden p-0 h-full transition-all duration-300
                      ${isTodayDate
                        ? 'border-[#d4af37] gold-pulse'
                        : isPastDate
                        ? 'opacity-50 hover:opacity-70 transition-opacity'
                        : ''
                      }
                    `}
                    style={isTodayDate ? {
                      boxShadow: '0 0 25px rgba(212,175,55,0.35), 0 0 50px rgba(212,175,55,0.15), inset 0 0 15px rgba(212,175,55,0.05)',
                    } : undefined}
                  >
                    {/* Day Header — tap to collapse/expand */}
                    <button
                      onClick={() => toggleDayCollapse(index)}
                      className={`
                        w-full p-3 sm:p-4 border-b text-left transition-colors
                        ${isTodayDate
                          ? 'border-[rgba(212,175,55,0.4)] bg-[rgba(212,175,55,0.08)]'
                          : 'border-[rgba(212,175,55,0.1)] hover:bg-[rgba(212,175,55,0.03)]'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              !collapsedDays.has(index) ? 'rotate-90' : ''
                            } ${isTodayDate ? 'text-[#d4af37]' : 'text-[#505050]'}`}
                          />
                          <span className={`
                            text-sm sm:text-base font-semibold uppercase
                            ${isTodayDate ? 'text-[#d4af37]' : isPastDate ? 'text-[#505050]' : 'text-[#f5f5f5]'}
                          `}>
                            <span className="sm:hidden">{weekDaysShort[index]}</span>
                            <span className="hidden sm:inline">{day}</span>
                            {isTodayDate && <span className="ml-2 text-[10px] tracking-wider opacity-70">{t.planner.today}</span>}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm text-[#707070] font-mono">
                          {completedCount}/{totalCount}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPastDate ? 'bg-[#3a3a3a]' : 'bg-gradient-to-r from-[#d4af37] to-[#f0d060]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </button>

                    {/* Tasks — collapsible, height fits content */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        collapsedDays.has(index) ? 'max-h-0' : 'max-h-[2000px]'
                      }`}
                    >
                    <div className="p-3 sm:p-4 space-y-2">
                      {dayTasks.length === 0 && addingTaskForDay !== index ? (
                        <p className="text-xs sm:text-sm text-[#707070] text-center py-6 sm:py-8">
                          {t.common.noTasks}
                        </p>
                      ) : (
                        dayTasks.map((task) => {
                          if (isPastDate) {
                            return (
                              <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg">
                                <div
                                  className={`mt-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    task.completed
                                      ? 'border-[#d4af37]/30 bg-[#d4af37]/15'
                                      : 'border-[#3a3a3a] bg-[#1c1c1c]'
                                  }`}
                                >
                                  {task.completed ? (
                                    <Check className="w-3 h-3 text-[#d4af37]/50" />
                                  ) : (
                                    <XIcon className="w-3 h-3 text-[#505050]" />
                                  )}
                                </div>
                                <span className="text-xs sm:text-sm leading-relaxed flex-1 text-[#505050] line-through">
                                  {task.title}
                                </span>
                              </div>
                            )
                          }

                          if (isTodayDate) {
                            return (
                              <div key={task.id} className="group flex items-start gap-2 p-2 rounded-lg hover:bg-[rgba(212,175,55,0.05)] transition-colors">
                                {/* Gold ball checkbox */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleComplete(task) }}
                                  className="mt-0.5 flex-shrink-0"
                                >
                                  <div
                                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                      task.completed
                                        ? 'border-[#d4af37] bg-[#d4af37]'
                                        : 'border-[#3a3a3a] hover:border-[#d4af37]/50'
                                    }`}
                                    style={task.completed ? {
                                      boxShadow: '0 0 8px rgba(212,175,55,0.5), 0 0 16px rgba(212,175,55,0.2)',
                                    } : undefined}
                                  >
                                    {task.completed && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0a0a0a] stroke-[3]" />}
                                  </div>
                                </button>
                                {/* Editable title */}
                                {editingTask?.id === task.id ? (
                                  <Input
                                    autoFocus
                                    value={editingTask.title}
                                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                    onKeyDown={handleEditKeyDown}
                                    onBlur={handleSaveEdit}
                                    className="h-6 text-xs sm:text-sm bg-transparent border-[rgba(212,175,55,0.3)] focus:border-[#d4af37] px-2 flex-1"
                                  />
                                ) : (
                                  <span
                                    className={`text-xs sm:text-sm leading-relaxed flex-1 cursor-pointer ${task.completed ? 'text-[#707070] line-through' : 'text-[#f5f5f5]'}`}
                                    onClick={(e) => { e.stopPropagation(); handleEditTask(task) }}
                                  >
                                    {task.title}
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <button onClick={(e) => { e.stopPropagation(); handleEditTask(task) }} className="text-[#707070] hover:text-[#d4af37]">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }} className="text-[#707070] hover:text-red-400">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          // Future: gold outline ball, editable
                          return (
                            <div key={task.id} className="group flex items-start gap-2 p-2 rounded-lg">
                              <div className="mt-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#2a2a2a] flex-shrink-0" />
                              {editingTask?.id === task.id ? (
                                <Input
                                  autoFocus
                                  value={editingTask.title}
                                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                  onKeyDown={handleEditKeyDown}
                                  onBlur={handleSaveEdit}
                                  className="h-6 text-xs sm:text-sm bg-transparent border-[rgba(212,175,55,0.3)] focus:border-[#d4af37] px-2 flex-1"
                                />
                              ) : (
                                <span
                                  className="text-xs sm:text-sm leading-relaxed flex-1 text-[#707070] cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); handleEditTask(task) }}
                                >
                                  {task.title}
                                </span>
                              )}
                              <div className="flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); handleEditTask(task) }} className="text-[#707070] hover:text-[#d4af37]">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }} className="text-[#707070] hover:text-red-400">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}

                      {addingTaskForDay === index && (
                        <div className="flex items-center gap-2 p-2">
                          <Input
                            autoFocus
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onBlur={() => handleBlur(index)}
                            placeholder={t.common.taskPlaceholder}
                            disabled={isCreating}
                            className="h-8 text-xs sm:text-sm bg-transparent border-[rgba(212,175,55,0.2)] focus:border-[#d4af37] px-3"
                          />
                          {isCreating && <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />}
                        </div>
                      )}

                      {addingTaskForDay !== index && !isPastDate && (
                        <button
                          onClick={() => handleAddTaskClick(index)}
                          className="flex items-center gap-2 text-[#707070] hover:text-[#d4af37] text-xs sm:text-sm transition-colors w-full p-2 rounded-lg hover:bg-[rgba(212,175,55,0.05)]"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">{t.common.addTask}</span>
                          <span className="sm:hidden">{t.common.add}</span>
                        </button>
                      )}
                    </div>
                    </div>{/* end collapsible wrapper */}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Day Detail Popup — motion animated */}
      {dayPopup && (() => {
        const popupTasks = tasksByDate[dayPopup.date] || []
        const completedTasks = popupTasks.filter(t => t.completed)
        const incompleteTasks = popupTasks.filter(t => !t.completed)
        const total = popupTasks.length
        const done = completedTasks.length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        const isPastDay = isPast(dayPopup.date)
        const isTodayDay = isToday(dayPopup.date)
        const isFutureDay = isFuture(dayPopup.date)

        const motivation = pct === 100
          ? t.planner.motivation100
          : pct >= 75
          ? t.planner.motivation75
          : pct >= 50
          ? t.planner.motivation50
          : pct > 0
          ? t.planner.motivationLow
          : total === 0
          ? (isFutureDay ? t.planner.motivationFuture : t.planner.motivationNoTasks)
          : t.planner.motivationZero

        const MotivIcon = pct === 100 ? Trophy : pct >= 50 ? TrendingUp : AlertTriangle
        const motivColor = pct >= 75 ? '#d4af37' : pct >= 50 ? '#a0a0a0' : '#707070'

        const [y, m, d] = dayPopup.date.split('-').map(Number)
        const displayDate = new Date(y, m - 1, d).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric'
        })

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
              onClick={() => setDayPopup(null)}
            />
            <div
              className="relative w-full sm:max-w-md glass-card sm:rounded-2xl rounded-t-2xl overflow-hidden"
              style={{
                borderColor: isTodayDay ? '#d4af37' : 'rgba(212,175,55,0.2)',
                borderWidth: 1,
                boxShadow: isTodayDay
                  ? '0 0 40px rgba(212,175,55,0.3), 0 0 80px rgba(212,175,55,0.1)'
                  : '0 0 30px rgba(0,0,0,0.5)',
                animation: 'popupSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[rgba(212,175,55,0.1)]">
                <div>
                  <h3 className="text-lg font-semibold text-[#f5f5f5]">{dayPopup.dayName}</h3>
                  <p className="text-xs text-[#707070] mt-0.5">{displayDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isTodayDay && (
                    <span className="px-2 py-0.5 rounded-full bg-[rgba(212,175,55,0.15)] text-[#d4af37] text-[10px] font-semibold uppercase tracking-wider border border-[rgba(212,175,55,0.3)]">
                      {t.common.today}
                    </span>
                  )}
                  <button
                    onClick={() => setDayPopup(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-[#707070] hover:text-[#f5f5f5] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats gauge */}
              <div className="px-5 py-4 border-b border-[rgba(212,175,55,0.1)] flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a2a" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none"
                      stroke={pct >= 75 ? '#d4af37' : pct >= 50 ? '#a0a0a0' : '#3a3a3a'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (pct / 100) * 251.2}
                      style={{
                        transition: 'stroke-dashoffset 0.8s ease-out',
                        filter: pct >= 75 ? 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' : 'none',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold font-mono" style={{ color: motivColor }}>{pct}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f5] font-medium">{done}/{total} {t.common.tasks}</p>
                  <p className="text-xs text-[#707070] mt-0.5">
                    {isPastDay ? `${done} ${t.common.completed} · ${total - done} ${t.common.missed}` : `${done} ${t.common.doneSoFar}`}
                  </p>
                </div>
              </div>

              {/* Task list with staggered animation */}
              <div className="px-5 py-3 max-h-[250px] overflow-y-auto space-y-1">
                {popupTasks.length === 0 ? (
                  <p className="text-sm text-[#505050] text-center py-6">{t.planner.noTasks}</p>
                ) : (
                  popupTasks.map((task, i) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-2 px-1"
                      style={{
                        animation: `popupItemFade 0.3s ease-out ${i * 0.05}s both`,
                      }}
                    >
                      {task.completed ? (
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(212,175,55,0.15)',
                            boxShadow: '0 0 8px rgba(212,175,55,0.2)',
                          }}
                        >
                          <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-[#1c1c1c] flex items-center justify-center flex-shrink-0">
                          {isPastDay ? (
                            <div className="w-2 h-2 rounded-full" style={{
                              background: 'radial-gradient(circle, #ff4444, #cc0000)',
                              boxShadow: '0 0 4px rgba(255,68,68,0.5)',
                            }} />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-[#2a2a2a]" />
                          )}
                        </div>
                      )}
                      <span className={`text-sm flex-1 ${
                        task.completed
                          ? 'text-[#a0a0a0] line-through'
                          : isPastDay ? 'text-[#505050]' : 'text-[#f5f5f5]'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Motivation */}
              <div
                className="px-5 py-4 border-t border-[rgba(212,175,55,0.1)] flex items-center gap-3"
                style={{ animation: 'popupItemFade 0.4s ease-out 0.3s both' }}
              >
                <MotivIcon className="w-5 h-5 flex-shrink-0" style={{ color: motivColor }} />
                <p className="text-sm italic" style={{ color: motivColor }}>{motivation}</p>
              </div>
            </div>

            <style>{`
              @keyframes popupSlideUp {
                from { opacity: 0; transform: translateY(30px) scale(0.96); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes popupItemFade {
                from { opacity: 0; transform: translateX(-10px); }
                to { opacity: 1; transform: translateX(0); }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
          </div>
        )
      })()}

      {/* Unfinished Tasks Popup */}
      {showUnfinishedPopup && unfinishedTasks.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />
          <div
            className="relative w-full sm:max-w-md glass-card sm:rounded-2xl rounded-t-2xl border border-[rgba(231,76,60,0.3)] overflow-hidden"
            style={{
              boxShadow: '0 0 30px rgba(231,76,60,0.15), 0 0 60px rgba(231,76,60,0.05)',
              animation: 'popupSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div className="p-5 border-b border-[rgba(231,76,60,0.15)] bg-[rgba(231,76,60,0.05)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[rgba(231,76,60,0.15)] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#e74c3c]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#f5f5f5]">
                    {unfinishedTasks.length} {t.common.tasks} not done
                  </h3>
                  <p className="text-xs text-[#707070] mt-0.5">Move to tomorrow or delete?</p>
                </div>
              </div>
            </div>

            {/* Task list */}
            <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
              {unfinishedTasks.map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(212,175,55,0.1)] bg-[rgba(0,0,0,0.2)]"
                  style={{ animation: `popupItemFade 0.3s ease-out ${i * 0.05}s both` }}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-[#3a3a3a] bg-[#1c1c1c] flex items-center justify-center flex-shrink-0">
                    <XIcon className="w-3 h-3 text-[#505050]" />
                  </div>
                  <span className="text-sm text-[#a0a0a0] flex-1">{task.title}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMoveToTomorrow(task.id)}
                      disabled={processingUnfinished}
                      className="p-1.5 rounded-lg bg-[rgba(212,175,55,0.1)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.2)] transition-colors"
                      title="Move to tomorrow"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUnfinished(task.id)}
                      className="p-1.5 rounded-lg bg-[rgba(231,76,60,0.1)] text-[#e74c3c] hover:bg-[rgba(231,76,60,0.2)] transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bulk actions */}
            <div className="p-4 border-t border-[rgba(212,175,55,0.1)] flex gap-3">
              <Button
                variant="luxury"
                className="flex-1 h-11 text-sm rounded-xl"
                onClick={handleMoveAllToTomorrow}
                disabled={processingUnfinished}
              >
                {processingUnfinished ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-1.5" />
                    Move all
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="flex-1 h-11 text-sm rounded-xl text-[#e74c3c] hover:bg-[rgba(231,76,60,0.1)]"
                onClick={handleDeleteAllUnfinished}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete all
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Analytics */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
          {t.planner.weeklyAnalytics}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <Card className="p-4 sm:p-6 flex flex-col items-center">
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4 sm:mb-6 text-center">
              {t.planner.weekly}
            </h3>
            <div className="flex items-center justify-center w-full">
              <div className="relative w-24 h-24 sm:w-44 sm:h-44 lg:w-52 lg:h-52">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a2a" strokeWidth="6" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="url(#weeklyGradient)" strokeWidth="6"
                    strokeDasharray={circumference} strokeDashoffset={weeklyOffset} strokeLinecap="round"
                    className="gold-glow transition-all duration-500" />
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4af37" /><stop offset="100%" stopColor="#f0d060" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl sm:text-3xl lg:text-4xl font-bold text-[#d4af37] font-mono">{weekStats.percentage}%</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-sm text-[#707070] text-center mt-3 sm:mt-4">
              {weekStats.completed}/{weekStats.total} {t.common.tasks}
            </p>
          </Card>

          <Card className="p-4 sm:p-6 flex flex-col items-center">
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-4 sm:mb-6 text-center">
              {t.planner.today}
            </h3>
            <div className="flex items-center justify-center w-full">
              <div className="relative w-24 h-24 sm:w-44 sm:h-44 lg:w-52 lg:h-52">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a2a" strokeWidth="6" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="url(#dailyGradient)" strokeWidth="6"
                    strokeDasharray={circumference} strokeDashoffset={todayOffset} strokeLinecap="round"
                    className="gold-glow transition-all duration-500" />
                  <defs>
                    <linearGradient id="dailyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4af37" /><stop offset="100%" stopColor="#f0d060" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl sm:text-3xl lg:text-4xl font-bold text-[#d4af37] font-mono">{todayStats.percentage}%</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-sm text-[#707070] text-center mt-3 sm:mt-4">
              {todayStats.completed}/{todayStats.total} {t.common.tasks}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
