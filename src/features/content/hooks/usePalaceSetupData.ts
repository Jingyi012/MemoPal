import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContentApi } from '../../../api/adminContentApi';

export function usePalaceSetupData(palaceId: string | undefined) {
  const queryClient = useQueryClient();

  const palaceQuery = useQuery({
    queryKey: ['admin-content', 'palace', palaceId],
    queryFn: () => adminContentApi.getPalaceById(palaceId!),
    enabled: !!palaceId,
  });

  const locationsQuery = useQuery({
    queryKey: ['admin-content', 'locations', palaceId],
    queryFn: () => adminContentApi.listLocationsByPalace(palaceId!),
    enabled: !!palaceId,
  });

  const lessonsQuery = useQuery({
    queryKey: ['admin-content', 'lessons', palaceId],
    queryFn: () => adminContentApi.listLessonsByPalace(palaceId!),
    enabled: !!palaceId,
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'palace', palaceId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'locations', palaceId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'lessons', palaceId] }),
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
