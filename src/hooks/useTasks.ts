import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Task } from '@/db/schema'

interface CreateTaskInput {
  title: string
  date: string
  type?: string
}

interface UpdateTaskInput {
  id: string
  title?: string
  completed?: boolean
  sortOrder?: number
}

async function fetchTasks(weekStart: string): Promise<Task[]> {
  const response = await fetch(`/api/tasks?week=${weekStart}`)
  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }
  return response.json()
}

async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create task')
  }
  return response.json()
}

async function updateTask(input: UpdateTaskInput): Promise<Task> {
  const { id, ...data } = input
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update task')
  }
  return response.json()
}

async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete task')
  }
}

export function useTasks(weekStart: string) {
  const queryClient = useQueryClient()
  const queryKey = ['tasks', weekStart]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchTasks(weekStart),
    enabled: !!weekStart,
  })

  const createMutation = useMutation({
    mutationFn: createTask,
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)

      // Optimistically update
      if (previousTasks) {
        const optimisticTask: Task = {
          id: `temp-${Date.now()}`,
          userId: '',
          title: newTask.title,
          date: newTask.date,
          type: newTask.type || 'daily',
          completed: false,
          sortOrder: 0,
          createdAt: new Date(),
        }
        queryClient.setQueryData<Task[]>(queryKey, [...previousTasks, optimisticTask])
      }

      return { previousTasks }
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks)
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey })

      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKey,
          previousTasks.map((task) =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task
          )
        )
      }

      return { previousTasks }
    },
    onError: (err, updatedTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey })

      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKey,
          previousTasks.filter((task) => task.id !== taskId)
        )
      }

      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Utility function to get the Monday of the current week
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

// Utility function to format week range for display
export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  const startDay = start.getDate()
  const endDay = end.getDate()
  const year = start.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`
}

// Utility function to get the date for a specific day of the week
export function getDateForDay(weekStart: string, dayIndex: number): string {
  const date = new Date(weekStart)
  date.setDate(date.getDate() + dayIndex)
  return date.toISOString().split('T')[0]
}

// Utility function to check if a date is today
export function isToday(dateString: string): boolean {
  const today = new Date()
  const date = new Date(dateString)
  return (
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  )
}
