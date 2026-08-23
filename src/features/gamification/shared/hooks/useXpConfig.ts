import * as xpConfigService from '@/features/gamification/shared/services/xpConfig.service';
import { useQuery } from '@tanstack/react-query';

export const XP_CONFIG_KEYS = {
  all: ['xpConfigs'] as const,
  lists: () => [...XP_CONFIG_KEYS.all, 'list'] as const,
  list: () => [...XP_CONFIG_KEYS.lists()] as const,
  bySource: (sourceType: string) => [...XP_CONFIG_KEYS.all, 'source', sourceType] as const,
};

export function useXpConfigList() {
  const query = useQuery({
    queryKey: XP_CONFIG_KEYS.list(),
    queryFn: () => xpConfigService.getXpConfigs(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return {
    configs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useXpConfigBySource(sourceType: string) {
  const query = useQuery({
    queryKey: XP_CONFIG_KEYS.bySource(sourceType),
    queryFn: () => xpConfigService.getXpConfigBySourceType(sourceType),
    enabled: !!sourceType,
    staleTime: 1000 * 60 * 5,
  });

  return query;
}
