import * as userStatsService from '@/services/userStats.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const USER_STATS_KEYS = {
  all: ['userStats'] as const,
  details: () => [...USER_STATS_KEYS.all, 'detail'] as const,
  detail: (userId: string) => [...USER_STATS_KEYS.details(), userId] as const,
};

export function useUserStats(userId: string) {
  const query = useQuery({
    queryKey: USER_STATS_KEYS.detail(userId),
    queryFn: () => userStatsService.getUserStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useUserLevel(userId: string) {
  const query = useQuery({
    queryKey: [...USER_STATS_KEYS.detail(userId), 'level'],
    queryFn: () => userStatsService.getUserLevel(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  return {
    level: query.data?.level ?? 1,
    xp: query.data?.xp ?? 0,
    isLoading: query.isLoading,
  };
}

export function useUserStatsMutations(userId: string) {
  const queryClient = useQueryClient();

  const updateStats = useMutation({
    mutationFn: (stats: any) => userStatsService.updateUserStats(userId, stats),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_STATS_KEYS.detail(userId) });
    },
  });

  return { updateStats };
}
