import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface HabitLog {
  id: string
  habitId: string
  date: string
  completed: boolean
}

export interface HabitLogsResponse {
  logs: HabitLog[]
}

interface ToggleLogResponse {
  log: HabitLog | null
  completed: boolean
}

export function useHabitLogs(month: string) {
  const queryClient = useQueryClient()

  const query = useQuery<HabitLogsResponse>({
    queryKey: ['habit-logs', month],
    queryFn: async () => {
      const response = await fetch(`/api/habit-logs?month=${month}`)
      if (!response.ok) {
        throw new Error('Failed to fetch habit logs')
      }
      return response.json()
    },
    enabled: !!month,
  })

  const toggleMutation = useMutation<
    ToggleLogResponse,
    Error,
    { habitId: string; date: string },
    { previousLogs: HabitLogsResponse | undefined }
  >({
    mutationFn: async ({ habitId, date }) => {
      const response = await fetch('/api/habit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to toggle habit log')
      }
      return response.json()
    },
    onMutate: async ({ habitId, date }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['habit-logs', month] })

      // Snapshot previous value
      const previousLogs = queryClient.getQueryData<HabitLogsResponse>(['habit-logs', month])

      // Optimistically update
      queryClient.setQueryData<HabitLogsResponse>(['habit-logs', month], (old) => {
        if (!old) return { logs: [{ id: 'temp', habitId, date, completed: true }] }

        const existingLogIndex = old.logs.findIndex(
          (log) => log.habitId === habitId && log.date === date
        )

        if (existingLogIndex >= 0) {
          // Remove the log (toggle off)
          return {
            logs: old.logs.filter((_, i) => i !== existingLogIndex),
          }
        } else {
          // Add the log (toggle on)
          return {
            logs: [...old.logs, { id: 'temp', habitId, date, completed: true }],
          }
        }
      })

      return { previousLogs }
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousLogs) {
        queryClient.setQueryData(['habit-logs', month], context.previousLogs)
      }
      toast.error(error.message)
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['habit-logs', month] })
    },
  })

  // Helper to check if a habit is completed on a given date
  const isCompleted = (habitId: string, date: string): boolean => {
    if (!query.data?.logs) return false
    return query.data.logs.some(
      (log) => log.habitId === habitId && log.date === date && log.completed
    )
  }

  // Helper to get completion count for a habit
  const getCompletionCount = (habitId: string): number => {
    if (!query.data?.logs) return 0
    return query.data.logs.filter((log) => log.habitId === habitId && log.completed).length
  }

  // Helper to get all completed dates for a habit
  const getCompletedDates = (habitId: string): string[] => {
    if (!query.data?.logs) return []
    return query.data.logs
      .filter((log) => log.habitId === habitId && log.completed)
      .map((log) => log.date)
  }

  return {
    logs: query.data?.logs || [],
    isLoading: query.isLoading,
    error: query.error,
    toggleLog: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    isCompleted,
    getCompletionCount,
    getCompletedDates,
  }
}
