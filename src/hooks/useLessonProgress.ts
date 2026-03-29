import * as lessonProgressService from '@/services/lessonProgress.service';
import type { LessonProgress } from '@/types/lesson';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PROGRESS_KEYS = {
  all: ['lessonProgress'] as const,
  detail: (lessonId: string) => [...PROGRESS_KEYS.all, lessonId] as const,
};

/**
 * Hook: Fetch lesson progress with automatic sync
 * Uses service layer for all business logic
 */
export function useLessonProgress(lessonId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PROGRESS_KEYS.detail(lessonId),
    enabled: !!lessonId,
    queryFn: async () => {
      // Always ensure local progress exists as soon as lesson page is opened.
      let progress = await lessonProgressService.initLessonProgress(lessonId);

      // Then sync with backend and refresh local snapshot if server has newer data.
      const syncedProgress = await lessonProgressService.getProgress(lessonId);
      if (syncedProgress) {
        progress = syncedProgress;
      }

      // Ensure learning mode is properly initialized
      await lessonProgressService.ensureLearningInitialized(progress);

      return progress;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.detail(lessonId) });
  };

  return {
    progress: query.data,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching,
    refresh: query.refetch,
    invalidate,
  };
}

/**
 * Hook: Save lesson progress
 * Delegates to service layer for offline-first storage and sync queueing
 */
export function useSaveLessonProgress() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (progress: LessonProgress) => {
      // Service handles local save and sync queueing
      await lessonProgressService.saveProgress(progress);
    },
    onSuccess: (_, progress) => {
      // Keep queries fresh
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.detail(progress.lessonId) });
    },
  });

  return {
    saveProgress: mutation.mutate,
    saveProgressAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
  };
}
