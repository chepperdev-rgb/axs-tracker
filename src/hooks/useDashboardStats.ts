'use client'

import { useQuery } from '@tanstack/react-query'

export interface DashboardStats {
  weeklyCompletion: number
  monthlyScore: number
  completionRatio: number
  tasksCompletedThisWeek: number
  totalTasksThisWeek: number
  tasksCompletedToday: number
  totalTasksToday: number
  bestDay: { day: string; percentage: number }
  monthlyCompletion: number
  checkIns: number
  activeDays: number
  bestStreak: number
  heatmapData: { date: string; percentage: number }[]
  weeklyData: number[]
  habitsInPlan: number
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats')

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats')
  }

  return response.json()
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}
