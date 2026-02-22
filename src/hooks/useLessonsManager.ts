import * as lessonService from '@/services/lesson.service';
import * as wordService from '@/services/word.service';
import { LessonForm } from '@/types/lesson';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * TanStack Query keys for lessons
 * Organized by query type for fine-grained cache invalidation
 */
export const LESSON_KEYS = {
  all: ['lessons'] as const,
  lists: () => [...LESSON_KEYS.all, 'list'] as const,
  byPalace: (palaceId: string) => [...LESSON_KEYS.lists(), 'palace', palaceId] as const,
  details: () => [...LESSON_KEYS.all, 'detail'] as const,
  detail: (lessonId: string) => [...LESSON_KEYS.details(), lessonId] as const,
};

/**
 * Hook: Fetch lessons for a palace
 * Uses TanStack Query for caching and reactive updates
 * Automatically syncs with backend and merges with local data
 */
export function useLessonList(palaceId: string) {
  const query = useQuery({
    queryKey: LESSON_KEYS.byPalace(palaceId),
    enabled: !!palaceId,
    queryFn: async () => {
      // Service handles sync and returns local data
      return await lessonService.getLessonsByPalace(palaceId);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes (formerly cacheTime)
  });

  return query;
}

/**
 * Hook: Fetch lesson details with words
 * Uses TanStack Query for caching and reactive updates
 */
export function useLessonDetail(lessonId?: string) {
  const query = useQuery({
    queryKey: LESSON_KEYS.detail(lessonId!),
    enabled: !!lessonId,
    queryFn: async () => {
      // Service handles sync and returns local data
      return await lessonService.getLessonById(lessonId!);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return query;
}

/**
 * Hook: Mutations for creating, updating, and deleting lessons
 * Handles optimistic updates and cache invalidation
 */
export function useLessonMutations(palaceId: string) {
  const queryClient = useQueryClient();

  /**
   * Create or update lesson with words
   */
  const saveLesson = useMutation({
    mutationFn: async (data: Partial<LessonForm> & { id?: string }) => {
      const { words = [], ...lessonData } = data;
      const wordCount = words.length;

      // Service saves locally and queues for sync
      const id =
        lessonData.id ||
        (await lessonService.createLesson({
          ...lessonData,
          wordCount,
          palaceId,
        }));

      // Sync words
      if (lessonData.id) {
        // Update existing lesson
        await lessonService.updateLesson(id, {
          ...lessonData,
          wordCount,
          palaceId,
        });
      }

      // Sync words for lesson
      if (words && words.length > 0) {
        await wordService.syncLessonWords(
          id,
          words.map((w) => ({
            ...w,
            lessonId: id,
            text: w.text!,
            locationId: w.locationId!,
          }))
        );
      }

      return { ...data, id };
    },
    onSuccess: (lesson) => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: LESSON_KEYS.byPalace(palaceId),
      });
      if (lesson.id) {
        queryClient.invalidateQueries({
          queryKey: LESSON_KEYS.detail(lesson.id),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to save lesson:', error);
    },
  });

  /**
   * Delete lesson
   */
  const removeLesson = useMutation({
    mutationFn: async (id: string) => {
      await lessonService.deleteLesson(id);
      return id;
    },
    onSuccess: (id) => {
      // Remove from detail queries and invalidate list
      queryClient.removeQueries({
        queryKey: LESSON_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: LESSON_KEYS.byPalace(palaceId),
      });
    },
    onError: (error) => {
      console.error('Failed to delete lesson:', error);
    },
  });

  return {
    saveLesson,
    removeLesson,
    isSaving: saveLesson.isPending,
    isDeleting: removeLesson.isPending,
  };
}
