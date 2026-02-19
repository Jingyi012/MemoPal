import { createXpEventsRepository } from '@/repositories/xpEvents.repo';
import { useQuery } from '@tanstack/react-query';

export const XP_KEYS = {
  all: ['xpEvents'] as const,
  total: () => [...XP_KEYS.all, 'total'] as const,
  events: () => [...XP_KEYS.all, 'events'] as const,
};

export function useTotalXp() {
  const repo = createXpEventsRepository();

  const query = useQuery({
    queryKey: XP_KEYS.total(),
    queryFn: async () => {
      return await repo.getTotalXp();
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    totalXp: query.data ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useXpEvents() {
  const repo = createXpEventsRepository();

  const query = useQuery({
    queryKey: XP_KEYS.events(),
    queryFn: async () => {
      return await repo.getAll();
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
