'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Habit } from '@/db/schema/habits'

// Extended habit type with month status
export interface HabitWithMonthStatus extends Habit {
  inCurrentMonth: boolean
}

interface HabitsResponse {
  habits: HabitWithMonthStatus[]
}

interface HabitResponse {
  habit: HabitWithMonthStatus
}

interface CreateHabitInput {
  name: string
  emoji?: string
  category?: string
  frequency?: string
  frequencyDays?: number[]
  addToCurrentMonth?: boolean
}

interface UpdateHabitInput {
  id: string
  name?: string
  emoji?: string | null
  category?: string | null
  frequency?: string
  frequencyDays?: number[]
  sortOrder?: number
  isArchived?: boolean
}

interface FetchHabitsOptions {
  includeArchived?: boolean
  year?: number
  month?: number
}

// Fetch all habits
async function fetchHabits(options: FetchHabitsOptions = {}): Promise<HabitsResponse> {
  const { includeArchived = false, year, month } = options
  const params = new URLSearchParams()
  if (includeArchived) params.set('includeArchived', 'true')
  if (year) params.set('year', year.toString())
  if (month) params.set('month', month.toString())

  const response = await fetch(`/api/habits?${params}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch habits')
  }
  return response.json()
}

// Create a new habit
async function createHabit(input: CreateHabitInput): Promise<HabitResponse> {
  const response = await fetch('/api/habits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create habit')
  }
  return response.json()
}

// Update a habit
async function updateHabit(input: UpdateHabitInput): Promise<HabitResponse> {
  const { id, ...data } = input
  const response = await fetch(`/api/habits/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update habit')
  }
  return response.json()
}

// Delete a habit
async function deleteHabit(id: string): Promise<void> {
  const response = await fetch(`/api/habits/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete habit')
  }
}

// Archive/unarchive a habit
async function archiveHabit(id: string): Promise<{ habit: HabitWithMonthStatus; archived: boolean }> {
  const response = await fetch(`/api/habits/${id}/archive`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to archive habit')
  }
  return response.json()
}

// Add habit to current month
async function addHabitToMonth(id: string, year?: number, month?: number): Promise<HabitResponse> {
  const response = await fetch(`/api/habits/${id}/add-to-month`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add habit to month')
  }
  return response.json()
}

// Remove habit from current month
async function removeHabitFromMonth(id: string, year?: number, month?: number): Promise<void> {
  const params = new URLSearchParams()
  if (year) params.set('year', year.toString())
  if (month) params.set('month', month.toString())

  const response = await fetch(`/api/habits/${id}/add-to-month?${params}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to remove habit from month')
  }
}

interface UseHabitsOptions {
  includeArchived?: boolean
  year?: number
  month?: number
}

export function useHabits(options: UseHabitsOptions = {}) {
  const { includeArchived = false, year, month } = options
  const queryClient = useQueryClient()
  const queryKey = ['habits', { includeArchived, year, month }]

  // Query for fetching habits
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchHabits({ includeArchived, year, month }),
  })

  // Mutation for creating a habit
  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  // Mutation for updating a habit
  const updateMutation = useMutation({
    mutationFn: updateHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  // Mutation for deleting a habit
  const deleteMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  // Mutation for archiving a habit
  const archiveMutation = useMutation({
    mutationFn: archiveHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  // Mutation for adding habit to month
  const addToMonthMutation = useMutation({
    mutationFn: ({ id, year, month }: { id: string; year?: number; month?: number }) =>
      addHabitToMonth(id, year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  // Mutation for removing habit from month
  const removeFromMonthMutation = useMutation({
    mutationFn: ({ id, year, month }: { id: string; year?: number; month?: number }) =>
      removeHabitFromMonth(id, year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  return {
    habits: data?.habits || [],
    isLoading,
    isError,
    error,
    refetch,

    // Create
    createHabit: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update
    updateHabit: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete
    deleteHabit: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Archive
    archiveHabit: archiveMutation.mutateAsync,
    isArchiving: archiveMutation.isPending,
    archiveError: archiveMutation.error,

    // Add to month
    addToMonth: addToMonthMutation.mutateAsync,
    isAddingToMonth: addToMonthMutation.isPending,
    addToMonthError: addToMonthMutation.error,

    // Remove from month
    removeFromMonth: removeFromMonthMutation.mutateAsync,
    isRemovingFromMonth: removeFromMonthMutation.isPending,
    removeFromMonthError: removeFromMonthMutation.error,
  }
}
