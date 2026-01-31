import { useXpEventsRepository } from '@/repositories/xpEvents.repo';
import { useQuery } from '@tanstack/react-query';

export const XP_KEYS = {
  all: ['xpEvents'] as const,
  userTotal: (userId: string) => [...XP_KEYS.all, 'total', userId] as const,
  userEvents: (userId: string) => [...XP_KEYS.all, 'events', userId] as const,
};

export function useUserTotalXp(userId: string) {
  const repo = useXpEventsRepository();

  const query = useQuery({
    queryKey: XP_KEYS.userTotal(userId),
    enabled: !!userId,
    queryFn: async () => {
      return await repo.getTotalXpByUserId(userId);
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

export function useUserXpEvents(userId: string) {
  const repo = useXpEventsRepository();

  const query = useQuery({
    queryKey: XP_KEYS.userEvents(userId),
    enabled: !!userId,
    queryFn: async () => {
      return await repo.getByUserId(userId);
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
