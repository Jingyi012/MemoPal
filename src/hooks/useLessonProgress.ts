import { useAuth } from '@/contexts/AuthProvider';
import { useLessonProgressRepository } from '@/repositories/lessonProgress.repo';
import { LessonProgressService } from '@/services/lessonProgress.service';
import type { LessonProgress } from '@/types/lesson';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PROGRESS_KEYS = {
  all: ['lessonProgress'] as const,
  detail: (lessonId: string) => [...PROGRESS_KEYS.all, lessonId] as const,
};

export function useLessonProgress(lessonId: string) {
  const { user } = useAuth();
  const repo = useLessonProgressRepository(user?.id!);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PROGRESS_KEYS.detail(lessonId),
    enabled: !!lessonId,
    queryFn: async () => {
      try {
        const remoteData = await LessonProgressService.getProgress(lessonId);

        if (remoteData) {
          await repo.upsertMany([remoteData]);
        }
      } catch (error) {
        console.warn('Progress sync failed, using local master');
      }

      let localData = await repo.getLessonProgress(lessonId);

      if (!localData) {
        localData = await repo.initLessonProgress(lessonId);
      }
      await repo.ensureLearningInitialized(localData);
      return localData;
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

export function useSaveLessonProgress() {
  const { user } = useAuth();
  const repo = useLessonProgressRepository(user?.id!);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (progress: LessonProgress) => {
      await repo.saveProgress(progress);
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
