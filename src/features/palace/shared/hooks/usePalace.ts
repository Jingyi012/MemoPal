import * as palaceService from '@/features/palace/shared/services/palace.service';
import type { Palace, PalaceDetails } from '@/features/palace/shared/types/palace.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PALACE_KEYS } from '@/features/palace/shared/queryKeys';

export { PALACE_KEYS } from '@/features/palace/shared/queryKeys';

export function usePalaceList() {
  return useQuery<Palace[]>({
    queryKey: PALACE_KEYS.list(),
    queryFn: () => palaceService.getPalaces(),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePalace(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: PALACE_KEYS.detail(id),
    enabled: !!id,
    retry: false,
    queryFn: () => palaceService.getPalaceById(id),
    staleTime: 1000 * 60 * 15,
    placeholderData: () => {
      const listData = queryClient.getQueryData<PalaceDetails[]>(PALACE_KEYS.list());
      return listData?.find((palace) => palace.id === id);
    },
  });
}

export function usePalaceMutations() {
  const queryClient = useQueryClient();

  const createPalace = useMutation({
    mutationFn: (payload: Partial<Palace>) => palaceService.createPalace(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PALACE_KEYS.all }),
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
