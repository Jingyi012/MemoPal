import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContentApi } from '../../../api/adminContentApi';
import { adminUsersApi } from '../../../api/adminUsersApi';

interface UseUserPalaceContentDataArgs {
  userId: string;
  palaceId: string;
}

export function useUserPalaceContentData({ userId, palaceId }: UseUserPalaceContentDataArgs) {
  const queryClient = useQueryClient();

  const palaceQuery = useQuery({
    queryKey: ['admin-content', 'palace', palaceId],
    queryFn: () => adminContentApi.getPalaceById(palaceId),
    enabled: !!palaceId,
  });

  const locationsQuery = useQuery({
    queryKey: ['admin-content', 'locations', palaceId],
    queryFn: () => adminContentApi.listLocationsByPalace(palaceId),
    enabled: !!palaceId,
  });

  const lessonsQuery = useQuery({
    queryKey: ['admin-user-data-user-lessons-by-palace', userId, palaceId],
    queryFn: () => adminUsersApi.listAllUserLessonsByPalace(userId, palaceId),
    enabled: !!userId && !!palaceId,
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'palace', palaceId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'locations', palaceId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-user-data-user-lessons-by-palace', userId, palaceId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-user-data-palaces-paged', userId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-user-data-overview', userId] }),
    ]);
  };

  return {
    palaceQuery,
    locationsQuery,
    lessonsQuery,
    refreshAll,
  };
}
