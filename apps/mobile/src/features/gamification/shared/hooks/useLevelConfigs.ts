import * as levelConfigService from '@/features/gamification/shared/services/levelConfig.service';
import { useQuery } from '@tanstack/react-query';

export const LEVEL_CONFIG_KEYS = {
  all: ['levelConfigs'] as const,
  list: () => [...LEVEL_CONFIG_KEYS.all, 'list'] as const,
  byXp: (xp: number) => [...LEVEL_CONFIG_KEYS.all, 'byXp', xp] as const,
};

export function useLevelConfigs() {
  const query = useQuery({
    queryKey: LEVEL_CONFIG_KEYS.list(),
    queryFn: async () => {
      return await levelConfigService.getLevelConfigs();
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    config: query.data ?? { xpPerLevel: 100 },
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useLevelByXp(totalXp: number, authoritativeLevel?: number) {
  const query = useQuery({
    queryKey: [...LEVEL_CONFIG_KEYS.byXp(totalXp), authoritativeLevel ?? null],
    queryFn: async () => {
      return await levelConfigService.getLevelProgress(totalXp, authoritativeLevel);
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    levelInfo: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
