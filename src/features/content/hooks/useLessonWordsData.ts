import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContentApi } from '../../../api/adminContentApi';

export function useLessonWordsData(palaceId: string | undefined, lessonId: string | undefined) {
  const queryClient = useQueryClient();

  const palaceQuery = useQuery({
    queryKey: ['admin-content', 'palace', palaceId],
    queryFn: () => adminContentApi.getPalaceById(palaceId!),
    enabled: !!palaceId,
  });

  const lessonQuery = useQuery({
    queryKey: ['admin-content', 'lesson', lessonId],
    queryFn: () => adminContentApi.getLessonById(lessonId!),
    enabled: !!lessonId,
  });

  const locationsQuery = useQuery({
    queryKey: ['admin-content', 'locations', palaceId],
    queryFn: () => adminContentApi.listLocationsByPalace(palaceId!),
    enabled: !!palaceId,
  });

  const wordsQuery = useQuery({
    queryKey: ['admin-content', 'words', lessonId],
    queryFn: () => adminContentApi.listWordsByLesson(lessonId!),
    enabled: !!lessonId,
  });

  const locationByIdMap = useMemo(
    () => new Map((locationsQuery.data ?? []).map((location) => [location.id, location])),
    [locationsQuery.data]
  );

  const refreshWords = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'words', lessonId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'lesson', lessonId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-content', 'lessons', palaceId] }),
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
