import { useLocationRepository } from '@/repositories/location.repo';
import { usePalaceRepository } from '@/repositories/palace.repo';
import { PalaceService } from '@/services/palace.service';
import { Palace, PalaceDetails } from '@/types/palace';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const PALACE_KEYS = {
  all: ['palaces'] as const,
  list: () => [...PALACE_KEYS.all, 'list'] as const,
  details: () => [...PALACE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PALACE_KEYS.details(), id] as const,
};

/**
 * HOOK: List of Palaces
 */
export function usePalaceList() {
  const repo = usePalaceRepository();

  const query = useQuery<Palace[]>({
    queryKey: PALACE_KEYS.list(),
    queryFn: async () => {
      try {
        const response = await PalaceService.getPalaces({});

        if (response.data?.length > 0) {
          await repo.upsertMany(response.data);
        }
      } catch (error) {
        console.warn('Network fetch failed, serving palaces from SQLite');
      }

      // SOURCE OF TRUTH: Always pull from SQLite
      const localPalaces = await repo.getAll();

      return localPalaces;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    palaces: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    refresh: query.refetch,
    totalCount: query.data?.length ?? 0,
  };
}

/**
 * HOOK: Single Palace Detail
 */
export function usePalace(id: string) {
  const repo = usePalaceRepository();
  const locationRepo = useLocationRepository();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: PALACE_KEYS.detail(id),
    enabled: !!id,
    retry: false,
    queryFn: async (): Promise<PalaceDetails> => {
      try {
        const palace = await PalaceService.getPalaceById(id);

        if (palace) {
          await repo.upsertMany([palace]);
          if (palace.locations && palace.locations.length > 0) {
            await locationRepo.upsertMany(palace.locations);
          }
        }
      } catch (error) {
        console.warn('Detail sync failed, serving from SQLite');
      }

      const localPalace = await repo.getById(id);

      if (!localPalace) {
        throw new Error('Palace not found locally or on network.');
      }

      return localPalace as PalaceDetails;
    },
    staleTime: 1000 * 60 * 15,

    // Instant UI: Get partial data from the list cache
    placeholderData: () => {
      const listData = queryClient.getQueryData<PalaceDetails[]>(PALACE_KEYS.list());
      return listData?.find((p) => p.id === id);
    },
  });
}
