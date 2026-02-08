import { useBadgeRepository } from '@/repositories/badge.repo';
import { BadgeService } from '@/services/badge.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const BADGE_KEYS = {
  all: ['badges'] as const,
  list: () => [...BADGE_KEYS.all, 'list'] as const,
  userBadges: (userId: string) => [...BADGE_KEYS.all, 'user', userId] as const,
};

export function useBadges() {
  const repo = useBadgeRepository();

  const query = useQuery({
    queryKey: BADGE_KEYS.list(),
    queryFn: async () => {
      try {
        const response = await BadgeService.getBadges({});

        if (response.data && response.data.length > 0) {
          const repo = useBadgeRepository();
          await repo.upsertMany(response.data);
        }
      } catch {}

      return await repo.getAll();
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    badges: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useUserBadges(userId: string) {
  const repo = useBadgeRepository();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: BADGE_KEYS.userBadges(userId),
    enabled: !!userId,
    queryFn: async () => {
      try {
        const response = await BadgeService.getUserBadges(userId);

        if (response.data && response.data.length > 0) {
          const repo = useBadgeRepository();
          await repo.upsertUserBadges(
            userId,
            response.data.map((badge: any) => ({
              badgeId: badge.id,
              earnedAt: badge.earnedAt || new Date().toISOString(),
            }))
          );
        }
      } catch {}

      const userBadges = await repo.getUserBadges(userId);
      return userBadges;
    },
    staleTime: 1000 * 60 * 5,
  });

  const awardBadge = async (badgeId: string) => {
    await repo.awardBadge(userId, badgeId);
    queryClient.invalidateQueries({ queryKey: BADGE_KEYS.userBadges(userId) });
  };

  return {
    userBadges: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    awardBadge,
  };
}
