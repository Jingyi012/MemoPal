import * as lessonService from '@/features/palace/shared/services/lesson.service';
import * as wordService from '@/features/palace/shared/services/word.service';
import type { LessonForm } from '@/features/palace/shared/types/lesson.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const LESSON_KEYS = {
  all: ['lessons'] as const,
  lists: () => [...LESSON_KEYS.all, 'list'] as const,
  byPalace: (palaceId: string) => [...LESSON_KEYS.lists(), 'palace', palaceId] as const,
  details: () => [...LESSON_KEYS.all, 'detail'] as const,
  detail: (lessonId: string) => [...LESSON_KEYS.details(), lessonId] as const,
};

export function useLessonList(palaceId: string) {
  return useQuery({
    queryKey: LESSON_KEYS.byPalace(palaceId),
    enabled: !!palaceId,
    queryFn: () => lessonService.getLessonsByPalace(palaceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
}

export function useLessonDetail(lessonId?: string) {
  return useQuery({
    queryKey: LESSON_KEYS.detail(lessonId!),
    enabled: !!lessonId,
    queryFn: () => lessonService.getLessonById(lessonId!),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
}

export function useLessonMutations(palaceId: string) {
  const queryClient = useQueryClient();

  const saveLesson = useMutation({
    mutationFn: async (data: Partial<LessonForm> & { id?: string }) => {
      const { words = [], ...lessonData } = data;
      const wordCount = words.length;
      const id =
        lessonData.id ||
        (await lessonService.createLesson({ ...lessonData, wordCount, palaceId }));

      if (lessonData.id) {
        await lessonService.updateLesson(id, { ...lessonData, wordCount, palaceId });
      }

      if (words.length > 0) {
        await wordService.syncLessonWords(
          id,
          words.map((word) => ({
            ...word,
            lessonId: id,
            text: word.text!,
            locationId: word.locationId!,
          }))
        );
      }

      return { ...data, id };
    },
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: LESSON_KEYS.byPalace(palaceId) });
      if (lesson.id) queryClient.invalidateQueries({ queryKey: LESSON_KEYS.detail(lesson.id) });
    },
    onError: (error) => console.error('Failed to save lesson:', error),
  });

  const removeLesson = useMutation({
    mutationFn: async (id: string) => {
      await lessonService.deleteLesson(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: LESSON_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: LESSON_KEYS.byPalace(palaceId) });
    },
    onError: (error) => console.error('Failed to delete lesson:', error),
  });

  return {
    saveLesson,
    removeLesson,
    isSaving: saveLesson.isPending,
    isDeleting: removeLesson.isPending,
  };
}
