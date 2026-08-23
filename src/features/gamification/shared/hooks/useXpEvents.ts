import { createXpEventsRepository } from '@/features/gamification/shared/repositories/xpEvents.repo';
import { useQuery } from '@tanstack/react-query';

export const XP_KEYS = {
  all: ['xpEvents'] as const,
  total: () => [...XP_KEYS.all, 'total'] as const,
  events: (recentDays?: number) =>
    [...XP_KEYS.all, 'events', recentDays ? `recent:${recentDays}` : 'all'] as const,
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

export function useXpEvents(options?: { recentDays?: number }) {
  const repo = createXpEventsRepository();
  const recentDays = options?.recentDays;

  const query = useQuery({
    queryKey: XP_KEYS.events(recentDays),
    queryFn: async () => {
      if (recentDays && recentDays > 0) {
        return await repo.getRecent(recentDays);
      }
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
