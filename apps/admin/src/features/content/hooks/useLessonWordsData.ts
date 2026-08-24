import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContentApi } from '../../../api/adminContentApi';

export function useLessonWordsData(palaceId: string | undefined, lessonId: string | undefined) {
  const queryClient = useQueryClient();
  const contentScope = { adminCreatedOnly: true } as const;
  const scopedSuffix = 'admin-created-only';

  const palaceQuery = useQuery({
    queryKey: ['admin-content', 'palace', palaceId, scopedSuffix],
    queryFn: () => adminContentApi.getPalaceById(palaceId!, contentScope),
    enabled: !!palaceId,
  });

  const lessonQuery = useQuery({
    queryKey: ['admin-content', 'lesson', lessonId, scopedSuffix],
    queryFn: () => adminContentApi.getLessonById(lessonId!, contentScope),
    enabled: !!lessonId,
  });

  const locationsQuery = useQuery({
    queryKey: ['admin-content', 'locations', palaceId, scopedSuffix],
    queryFn: () => adminContentApi.listLocationsByPalace(palaceId!, contentScope),
    enabled: !!palaceId,
  });

  const wordsQuery = useQuery({
    queryKey: ['admin-content', 'words', lessonId, scopedSuffix],
    queryFn: () => adminContentApi.listWordsByLesson(lessonId!, contentScope),
    enabled: !!lessonId,
  });

  const locationByIdMap = useMemo(
    () => new Map((locationsQuery.data ?? []).map((location) => [location.id, location])),
    [locationsQuery.data]
  );

  const refreshWords = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'words', lessonId, scopedSuffix] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'lesson', lessonId, scopedSuffix] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'lessons', palaceId, scopedSuffix] }),
    ]);
  };

  return {
    palaceQuery,
    lessonQuery,
    locationsQuery,
    wordsQuery,
    locationByIdMap,
    refreshWords,
  };
}
