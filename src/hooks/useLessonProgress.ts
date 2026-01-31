import { useAuth } from '@/contexts/AuthProvider';
import { useLessonProgressRepository } from '@/repositories/lessonProgress.repo';
import { LessonProgressService } from '@/services/lessonProgress.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
          await repo.saveProgress(remoteData);
        }
      } catch (error) {
        console.warn('Progress sync failed, using local master');
      }

      const localData = await repo.getLessonProgress(lessonId);

      return localData;
    },

    staleTime: 1000 * 60 * 5,
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
