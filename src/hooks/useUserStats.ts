import { useUserStatsRepository } from '@/repositories/userStats.repo';
import { UserStatsService } from '@/services/userStats.service';
import { useQuery } from '@tanstack/react-query';

export const USER_STATS_KEYS = {
  all: ['userStats'] as const,
  detail: (userId: string) => [...USER_STATS_KEYS.all, userId] as const,
};

export function useUserStats(userId: string) {
  const repo = useUserStatsRepository();

  const query = useQuery({
    queryKey: USER_STATS_KEYS.detail(userId),
    enabled: !!userId,
    queryFn: async () => {
      const stats = await UserStatsService.getUserStats(userId);

      if (stats) {
        const repo = useUserStatsRepository();
        await repo.upsertMany([stats]);
      }

      return await repo.getByUserId(userId);
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
