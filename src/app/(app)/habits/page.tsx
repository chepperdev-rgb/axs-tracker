'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Star, MoreHorizontal, Archive, Trash2, Calendar, Loader2, ArchiveRestore, X, Pencil } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useHabits, type HabitWithMonthStatus } from '@/hooks/use-habits'
import { toast } from 'sonner'
import { useTranslations } from '@/providers/i18n-provider'

// ─── Edit Modal ─────────────────────────────────────────────────────
function EditHabitModal({
  habit,
  onSave,
  onClose,
  isSaving,
}: {
  habit: HabitWithMonthStatus
  onSave: (data: { name: string; emoji: string; category: string }) => void
  onClose: () => void
  isSaving: boolean
}) {
  const [name, setName] = useState(habit.name)
  const [emoji, setEmoji] = useState(habit.emoji || '')
  const [category, setCategory] = useState(habit.category || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Habit name is required')
      return
    }
    onSave({ name: name.trim(), emoji, category })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative w-full max-w-md glass-card rounded-2xl p-6 border border-[rgba(212,175,55,0.2)]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#f5f5f5]">Edit Habit</h3>
          <button
            onClick={onClose}
            className="text-[#707070] hover:text-[#f5f5f5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#a0a0a0] text-xs uppercase tracking-wider">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(212,175,55,0.15)] text-[#f5f5f5] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#a0a0a0] text-xs uppercase tracking-wider">Emoji</Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🏋️"
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(212,175,55,0.15)] text-[#f5f5f5] placeholder:text-[#707070] focus:border-[#d4af37] focus:ring-[#d4af37]/20"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#a0a0a0] text-xs uppercase tracking-wider">Category</Label>
            <div className="flex flex-wrap gap-2">
              {['health', 'productivity', 'growth', 'mindfulness', 'finance'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? '' : cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    category === cat
                      ? 'bg-[rgba(212,175,55,0.15)] border-[#d4af37] text-[#d4af37]'
                      : 'border-[#2a2a2a] text-[#707070] hover:border-[#505050]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-[#a0a0a0] hover:text-[#f5f5f5]"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="luxury"
              className="flex-1"
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
export default function HabitsPage() {
  const t = useTranslations()
  const [newHabit, setNewHabit] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithMonthStatus | null>(null)

  const {
    habits,
    isLoading,
    isError,
    error,
    createHabit,
    isCreating,
    updateHabit,
    isUpdating,
    deleteHabit,
    isDeleting,
    archiveHabit,
    isArchiving,
    addToMonth,
    isAddingToMonth,
    removeFromMonth,
    isRemovingFromMonth,
  } = useHabits({ includeArchived: showArchived })

  const activeHabits = habits.filter(h => !h.isArchived)
  const archivedHabits = habits.filter(h => h.isArchived)

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHabit.trim()) {
      toast.error('Please enter a habit name')
      return
    }

    try {
      await createHabit({ name: newHabit.trim() })
      setNewHabit('')
      toast.success('Habit added to library')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create habit')
    }
  }

  const handleEditSave = async (data: { name: string; emoji: string; category: string }) => {
    if (!editingHabit) return
    try {
      await updateHabit({
        id: editingHabit.id,
        name: data.name,
        emoji: data.emoji || null,
        category: data.category || null,
      })
      setEditingHabit(null)
      toast.success('Habit updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update habit')
    }
  }

  const handleAddToMonth = async (habitId: string) => {
    try {
      await addToMonth({ id: habitId })
      toast.success('Habit added to current month')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add habit to month')
    }
  }

  const handleRemoveFromMonth = async (habitId: string) => {
    try {
      await removeFromMonth({ id: habitId })
      toast.success('Habit removed from current month')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove habit from month')
    }
  }

  const handleArchive = async (habitId: string, isCurrentlyArchived: boolean) => {
    try {
      await archiveHabit(habitId)
      toast.success(isCurrentlyArchived ? 'Habit restored' : 'Habit archived')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive habit')
    }
  }

  const handleDelete = async (habitId: string) => {
    try {
      await deleteHabit(habitId)
      toast.success('Habit deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete habit')
    }
  }

  const isOperating = isCreating || isDeleting || isArchiving || isAddingToMonth || isRemovingFromMonth || isUpdating

  if (isError) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="p-6 text-center">
          <p className="text-[#e74c3c] mb-4">
            {error instanceof Error ? error.message : 'Failed to load habits'}
          </p>
          <Button variant="gold-outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Edit Modal */}
      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onSave={handleEditSave}
          onClose={() => setEditingHabit(null)}
          isSaving={isUpdating}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            {t.habits.title}
          </h1>
          <p className="text-sm sm:text-lg text-[#f5f5f5] mt-1">
            {t.habits.subtitle}
          </p>
        </div>
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[rgba(212,175,55,0.3)] text-[#a0a0a0] text-xs sm:text-sm self-start">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin inline" />
          ) : (
            <>
              <span className="text-[#d4af37] font-semibold gold-glow">{activeHabits.length}</span> {t.common.active}
            </>
          )}
        </div>
      </div>

      {/* Add Habit Form */}
      <Card className="p-3 sm:p-5">
        <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
          {t.habits.addToLibrary}
        </h3>
        <form onSubmit={handleCreateHabit} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder={t.habits.placeholder}
            className="flex-1 bg-[rgba(0,0,0,0.3)] border-[rgba(212,175,55,0.15)] text-[#f5f5f5] placeholder:text-[#707070] focus:border-[#d4af37] focus:ring-[#d4af37]/20 text-sm"
            disabled={isCreating}
          />
          <Button
            type="submit"
            variant="luxury"
            className="w-full sm:w-auto px-4 sm:px-6 text-xs sm:text-sm"
            disabled={isCreating || !newHabit.trim()}
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">{t.habits.saveToLibrary}</span>
                <span className="sm:hidden">{t.common.save.toUpperCase()}</span>
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
        </div>
      )}

      {/* Habit List */}
      {!isLoading && (
        <div className="space-y-2">
          {activeHabits.length === 0 && !isLoading && (
            <Card className="p-6 text-center">
              <p className="text-[#707070]">No habits yet. Add your first habit above.</p>
            </Card>
          )}

          {activeHabits.map((habit) => (
            <Card
              key={habit.id}
              className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between hover:border-[rgba(212,175,55,0.3)] transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {habit.emoji ? (
                  <span className="text-lg sm:text-xl flex-shrink-0">{habit.emoji}</span>
                ) : (
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] flex-shrink-0 gold-glow" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base text-[#f5f5f5] font-medium">{habit.name}</span>
                  {habit.category && (
                    <span className="text-[10px] text-[#707070] uppercase tracking-wider">{habit.category}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {habit.inCurrentMonth ? (
                  <button
                    onClick={() => handleRemoveFromMonth(habit.id)}
                    disabled={isOperating}
                    className="px-2 sm:px-3 py-1 rounded-full bg-[rgba(212,175,55,0.15)] text-[#d4af37] text-[10px] sm:text-xs font-medium border border-[rgba(212,175,55,0.3)] hover:bg-[rgba(212,175,55,0.25)] transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    {t.habits.inMonth}
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <Button
                    variant="gold-outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleAddToMonth(habit.id)}
                    disabled={isOperating}
                  >
                    {isAddingToMonth ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{t.habits.addToMonth}</span>
                        <span className="sm:hidden">{t.common.add}</span>
                      </>
                    )}
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-[#707070] hover:text-[#f5f5f5] hover:bg-[rgba(212,175,55,0.1)]"
                      disabled={isOperating}
                    >
                      <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="glass-card rounded-xl"
                  >
                    <DropdownMenuItem
                      className="text-[#d4af37] hover:text-[#f0d060] hover:bg-[rgba(212,175,55,0.1)] cursor-pointer"
                      onClick={() => setEditingHabit(habit)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                    <DropdownMenuItem
                      className="text-[#707070] hover:text-[#a0a0a0] hover:bg-[rgba(255,255,255,0.05)] cursor-pointer"
                      onClick={() => handleArchive(habit.id, false)}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      {t.common.archive}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-[#e74c3c] hover:text-[#e74c3c] hover:bg-[rgba(231,76,60,0.1)] cursor-pointer"
                      onClick={() => handleDelete(habit.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.common.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Archived Section */}
      {!isLoading && (
        <div className="mt-6">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#707070] hover:text-[#a0a0a0] transition-colors mb-3 flex items-center gap-2"
          >
            <Archive className="w-3 h-3" />
            {showArchived ? 'HIDE ARCHIVED' : `SHOW ARCHIVED (${archivedHabits.length})`}
          </button>

          {showArchived && archivedHabits.length > 0 && (
            <div className="space-y-2 opacity-60">
              {archivedHabits.map((habit) => (
                <Card
                  key={habit.id}
                  className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between border-dashed"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {habit.emoji ? (
                      <span className="text-lg sm:text-xl flex-shrink-0 grayscale">{habit.emoji}</span>
                    ) : (
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#707070] flex-shrink-0" />
                    )}
                    <span className="text-sm sm:text-base text-[#707070] font-medium line-through">{habit.name}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="gold-outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleArchive(habit.id, true)}
                      disabled={isOperating}
                    >
                      <ArchiveRestore className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Restore</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#e74c3c] hover:text-[#e74c3c] hover:bg-[rgba(231,76,60,0.1)]"
                      onClick={() => handleDelete(habit.id)}
                      disabled={isOperating}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* How It Works Section */}
      <Card className="p-3 sm:p-5">
        <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-[#a0a0a0] mb-3 sm:mb-4">
          {t.habits.howItWorks}
        </h3>
        <div className="space-y-2 sm:space-y-3 text-[#a0a0a0] text-xs sm:text-sm">
          <p>
            <span className="text-[#d4af37] font-semibold">1.</span> {t.habits.step1}
          </p>
          <p>
            <span className="text-[#d4af37] font-semibold">2.</span> {t.habits.step2}
          </p>
          <p>
            <span className="text-[#d4af37] font-semibold">3.</span> {t.habits.step3}
          </p>
        </div>
      </Card>
    </div>
  )
}
