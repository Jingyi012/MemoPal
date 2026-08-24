import { userStatsApi } from '@/features/gamification/shared/api/userStats';
import { xpEventApi } from '@/features/gamification/shared/api/xpEvent';
import { useQuery } from '@tanstack/react-query';

export const XP_KEYS = {
  all: ['xpEvents'] as const,
  total: () => [...XP_KEYS.all, 'total'] as const,
  events: (recentDays?: number) =>
    [...XP_KEYS.all, 'events', recentDays ? `recent:${recentDays}` : 'all'] as const,
};

export function useTotalXp() {
  const query = useQuery({
    queryKey: XP_KEYS.total(),
    queryFn: async () => (await userStatsApi.getLevel()).xp,
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
  const recentDays = options?.recentDays;

  const query = useQuery({
    queryKey: XP_KEYS.events(recentDays),
    queryFn: () => xpEventApi.getAll(recentDays),
    staleTime: 1000 * 60 * 5,
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
