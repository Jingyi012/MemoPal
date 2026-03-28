import * as palaceService from '@/services/palace.service';
import { Palace, PalaceDetails } from '@/types/palace';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const query = useQuery<Palace[]>({
    queryKey: PALACE_KEYS.list(),
    queryFn: async () => palaceService.getPalaces(),
    staleTime: 1000 * 60 * 5,
  });

  return query;
}

/**
 * HOOK: Single Palace Detail
 */
export function usePalace(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: PALACE_KEYS.detail(id),
    enabled: !!id,
    retry: false,
    queryFn: async () => palaceService.getPalaceById(id),
    staleTime: 1000 * 60 * 15,

    // Instant UI: Get partial data from the list cache
    placeholderData: () => {
      const listData = queryClient.getQueryData<PalaceDetails[]>(PALACE_KEYS.list());
      return listData?.find((p) => p.id === id);
    },
  });
}

export function usePalaceMutations() {
  const queryClient = useQueryClient();

  const createPalace = useMutation({
    mutationFn: (payload: Partial<Palace>) => palaceService.createPalace(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PALACE_KEYS.all });
    },
  });

  const deletePalace = useMutation({
    mutationFn: (palaceId: string) => palaceService.deletePalace(palaceId),
    onSuccess: (_, palaceId) => {
      queryClient.removeQueries({ queryKey: PALACE_KEYS.detail(palaceId) });
      queryClient.invalidateQueries({ queryKey: PALACE_KEYS.all });
    },
  });

  return { createPalace, deletePalace };
}
