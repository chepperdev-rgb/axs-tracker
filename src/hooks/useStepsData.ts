'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface StepsData {
  steps: number | null
  date: string
  source?: string
  syncedAt?: string
}

async function fetchSteps(date: string): Promise<StepsData> {
  const res = await fetch(`/api/health/steps?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch steps')
  return res.json()
}

async function syncSteps(data: { date: string; steps: number; source?: string }) {
  const res = await fetch('/api/health/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, source: data.source ?? 'manual' }),
  })
  if (!res.ok) throw new Error('Failed to sync steps')
  return res.json()
}

export function useStepsData(date: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['steps', date],
    queryFn: () => fetchSteps(date),
    staleTime: 60 * 1000,
    refetchInterval: false,        // no auto-polling — user refreshes manually
    refetchOnWindowFocus: false,
  })

  const mutation = useMutation({
    mutationFn: syncSteps,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['steps', newData.date] })
      const prev = queryClient.getQueryData<StepsData>(['steps', newData.date])
      queryClient.setQueryData(['steps', newData.date], {
        steps: newData.steps,
        date: newData.date,
        source: 'manual',
        syncedAt: new Date().toISOString(),
      })
      return { prev }
    },
    onError: (_err, newData, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['steps', newData.date], context.prev)
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['steps', vars.date] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  return {
    steps: query.data?.steps ?? null,
    source: query.data?.source,
    syncedAt: query.data?.syncedAt,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,        // manual refresh — call on button click or pull-to-refresh
    updateSteps: mutation.mutate,
    isUpdating: mutation.isPending,
  }
}
