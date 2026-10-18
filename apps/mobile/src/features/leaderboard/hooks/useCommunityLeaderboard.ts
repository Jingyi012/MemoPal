import { useAuth } from '@/contexts/AuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityLeaderboardApi } from '../api/communityLeaderboard.api';

export const COMMUNITY_LEADERBOARD_KEYS = {
  catalog: ['leaderboard-catalog'] as const,
  all: ['community-leaderboard'] as const,
  current: (userId: string) => ['community-leaderboard', userId, 'current'] as const,
};

export function useLeaderboardCatalog() {
  const { user } = useAuth();
  return useQuery({
    queryKey: COMMUNITY_LEADERBOARD_KEYS.catalog,
    queryFn: communityLeaderboardApi.getCatalog,
    enabled: Boolean(user?.id),
    staleTime: 0,
  });
}

export function useCommunityLeaderboard(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: COMMUNITY_LEADERBOARD_KEYS.current(user?.id ?? 'anonymous'),
    queryFn: communityLeaderboardApi.getCurrent,
    enabled: Boolean(user?.id) && enabled,
    staleTime: 0,
    refetchInterval: (query) => {
      const reward = query.state.data?.latestReward;
      if (!reward || new Date(reward.weekStartsAtUtc).getTime() >= Date.parse(query.state.data?.weekStartsAtUtc ?? '')) return false;
      return reward.seasonStatus === 'settled' ? false : 30_000;
    },
  });
}

export function useCommunityLeaderboardPreference() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityLeaderboardApi.setOptIn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: COMMUNITY_LEADERBOARD_KEYS.current(user?.id ?? 'anonymous'),
      });
    },
  });
}
