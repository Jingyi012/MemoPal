import * as reviewService from '@/services/review.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PROGRESS_KEYS } from './useLessonProgress';

export function useReviewCompletion() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      lessonId,
      correctCount,
      totalCount,
      isLearningMode,
    }: {
      lessonId: string;
      correctCount: number;
      totalCount: number;
      isLearningMode?: boolean;
    }) => {
      return reviewService.completeReview(lessonId, correctCount, totalCount, isLearningMode);
    },
    onSuccess: ({ lessonId }) => {
      // Invalidate queries so the UI reflects new XP and schedule immediately
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.detail(lessonId) });
    },
  });

  return mutation;
}
