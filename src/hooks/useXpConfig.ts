import { useXpConfigRepository } from '@/repositories/xpConfig.repo';
import { XpConfigService } from '@/services/xpConfig.service';
import { useQuery } from '@tanstack/react-query';

export const XP_CONFIG_KEYS = {
  all: ['xpConfigs'] as const,
  list: () => [...XP_CONFIG_KEYS.all, 'list'] as const,
  bySource: (sourceType: string) => [...XP_CONFIG_KEYS.all, 'source', sourceType] as const,
};

export function useXpConfigList() {
  const repo = useXpConfigRepository();

  const query = useQuery({
    queryKey: XP_CONFIG_KEYS.list(),
    queryFn: async () => {
      try {
        const response = await XpConfigService.getXpConfigs();

        if (response && response.length > 0) {
          // Keep local DB in sync
          await repo.upsertMany(response);
        }
      } catch (error) {
        console.warn('Network fetch failed, serving xp configs from SQLite');
      }

      // SOURCE OF TRUTH: Always pull from SQLite
      const localConfigs = await repo.getAll();

      return localConfigs;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    configs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refresh: query.refetch,
  };
}

export function useXpConfigBySource(sourceType: string) {
  const repo = useXpConfigRepository();

  return useQuery({
    queryKey: XP_CONFIG_KEYS.bySource(sourceType),
    enabled: !!sourceType,
    retry: false,
    queryFn: async () => {
      try {
        const cfg = await XpConfigService.getXpConfigBySourceType(sourceType);
        if (cfg) {
          await repo.upsertMany([cfg]);
        }
      } catch (error) {}

      const local = await repo.getBySourceType(sourceType);

      if (!local) {
        throw new Error('XP config not found locally or on network.');
      }

      return local;
    },
    staleTime: 1000 * 60 * 5,
  });
}
