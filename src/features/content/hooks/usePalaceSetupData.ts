import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContentApi } from '../../../api/adminContentApi';

export function usePalaceSetupData(palaceId: string | undefined) {
  const queryClient = useQueryClient();
  const contentScope = { adminCreatedOnly: true } as const;
  const scopedSuffix = 'admin-created-only';

  const palaceQuery = useQuery({
    queryKey: ['admin-content', 'palace', palaceId, scopedSuffix],
    queryFn: () => adminContentApi.getPalaceById(palaceId!, contentScope),
    enabled: !!palaceId,
  });

  const locationsQuery = useQuery({
    queryKey: ['admin-content', 'locations', palaceId, scopedSuffix],
    queryFn: () => adminContentApi.listLocationsByPalace(palaceId!, contentScope),
    enabled: !!palaceId,
  });

  const lessonsQuery = useQuery({
    queryKey: ['admin-content', 'lessons', palaceId, scopedSuffix],
    queryFn: () => adminContentApi.listLessonsByPalace(palaceId!, contentScope),
    enabled: !!palaceId,
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'palace', palaceId, scopedSuffix] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'locations', palaceId, scopedSuffix] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'lessons', palaceId, scopedSuffix] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content-palaces'] }),
    ]);
  };

  return {
    palaceQuery,
    locationsQuery,
    lessonsQuery,
    refreshAll,
  };
}
