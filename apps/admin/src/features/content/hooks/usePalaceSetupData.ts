import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContentApi } from '../../../api/adminContentApi';

interface UsePalaceSetupDataOptions {
  fetchLocations?: boolean;
  fetchLessons?: boolean;
}

export function usePalaceSetupData(
  palaceId: string | undefined,
  options?: UsePalaceSetupDataOptions,
) {
  const queryClient = useQueryClient();
  const contentScope = { adminCreatedOnly: true } as const;
  const scopedSuffix = 'admin-created-only';
  const fetchLocations = options?.fetchLocations ?? true;
  const fetchLessons = options?.fetchLessons ?? true;

  const palaceQuery = useQuery({
    queryKey: ['admin-content', 'palace', palaceId, scopedSuffix],
    queryFn: () => adminContentApi.getPalaceById(palaceId!, contentScope),
    enabled: !!palaceId,
  });

  const locationsQuery = useQuery({
    queryKey: ['admin-content', 'locations', palaceId, scopedSuffix],
    queryFn: () => adminContentApi.listLocationsByPalace(palaceId!, contentScope),
    enabled: !!palaceId && fetchLocations,
  });

  const lessonsQuery = useQuery({
    queryKey: ['admin-content', 'lessons', palaceId, scopedSuffix],
    queryFn: () => adminContentApi.listLessonsByPalace(palaceId!, contentScope),
    enabled: !!palaceId && fetchLessons,
  });

  const refreshLocations = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-content', 'locations', palaceId, scopedSuffix] });
  };

  const refreshLessons = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-content', 'lessons', palaceId, scopedSuffix] });
  };

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'palace', palaceId, scopedSuffix] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'locations', palaceId, scopedSuffix] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'lessons', palaceId, scopedSuffix] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'palaces'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content-palaces'] }),
    ]);
  };

  return {
    palaceQuery,
    locationsQuery,
    lessonsQuery,
    refreshLocations,
    refreshLessons,
    refreshAll,
  };
}
