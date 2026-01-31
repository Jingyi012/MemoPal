import { useLevelConfigRepository } from '@/repositories/levelConfig.repo';
import { useQuery } from '@tanstack/react-query';

export const LEVEL_CONFIG_KEYS = {
  all: ['levelConfigs'] as const,
  list: () => [...LEVEL_CONFIG_KEYS.all, 'list'] as const,
  byXp: (xp: number) => [...LEVEL_CONFIG_KEYS.all, 'byXp', xp] as const,
};

export function useLevelConfigs() {
  const repo = useLevelConfigRepository();

  const query = useQuery({
    queryKey: LEVEL_CONFIG_KEYS.list(),
    queryFn: async () => {
      return await repo.getAll();
    },
    staleTime: Infinity, // Level configs don't change often
  });

  return {
    configs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useLevelByXp(totalXp: number) {
  const repo = useLevelConfigRepository();

  const query = useQuery({
    queryKey: LEVEL_CONFIG_KEYS.byXp(totalXp),
    queryFn: async () => {
      const currentLevel = await repo.getLevelByXp(totalXp);
      const currentLevelConfig = await repo.getByLevel(currentLevel);
      const nextLevelConfig = await repo.getNextLevel(currentLevel);

      const currentLevelXp = currentLevelConfig?.requiredXp ?? 0;
      const nextLevelXp = nextLevelConfig?.requiredXp ?? currentLevelXp + 1000;

      return {
        currentLevel,
        currentLevelConfig,
        nextLevelConfig,
        xpInCurrentLevel: totalXp - currentLevelXp,
        xpToNextLevel: Math.max(0, nextLevelXp - totalXp),
        totalXp,
      };
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
