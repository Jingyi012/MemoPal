import * as lessonProgressService from '@/features/palace/shared/services/lessonProgress.service';
import type { LessonProgress } from '@/features/palace/shared/types/lesson.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PROGRESS_KEYS = {
  all: ['lessonProgress'] as const,
  detail: (lessonId: string) => [...PROGRESS_KEYS.all, lessonId] as const,
};

export function useLessonProgress(lessonId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: PROGRESS_KEYS.detail(lessonId),
    enabled: !!lessonId,
    staleTime: 0,
    refetchOnMount: 'always' as const,
    queryFn: async () => {
      let progress = await lessonProgressService.getProgress(lessonId);
      if (!progress) progress = await lessonProgressService.initLessonProgress(lessonId);
      await lessonProgressService.ensureLearningInitialized(progress);
      return progress;
    },
  });

  return {
    progress: query.data,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching,
    refresh: query.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.detail(lessonId) }),
  };
}

export function useSaveLessonProgress() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (progress: LessonProgress) => lessonProgressService.saveProgress(progress),
    onSuccess: (_, progress) => {
      queryClient.setQueryData(PROGRESS_KEYS.detail(progress.lessonId), progress);
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
