import { useReviewRepository } from '@/repositories/review.repo';
import { recordXpEvent, useXpConfigRepository } from '@/repositories/xpConfig.repo';
import { useMutation } from '@tanstack/react-query';

export function useReviewCompletion() {
  const reviewRepo = useReviewRepository();
  const xpConfigRepo = useXpConfigRepository();

  const submitReview = useMutation({
    mutationFn: async ({
      userId,
      lessonId,
      correctCount,
      totalCount,
    }: {
      userId: string;
      lessonId: string;
      correctCount: number;
      totalCount: number;
    }) => {
      // Get XP config for review completion
      const xpConfig = await xpConfigRepo.getBySourceType('review_complete');
      const baseXp = xpConfig?.xpAmount ?? 10;

      // Calculate XP based on accuracy
      const accuracy = correctCount / totalCount;
      const xpEarned = Math.floor(baseXp * accuracy);

      // Record XP event
      await recordXpEvent(userId, 'review_complete', xpEarned, lessonId);

      // Update lesson progress
      await reviewRepo.updateLessonProgressAfterReview(
        userId,
        lessonId,
        xpEarned,
        correctCount,
        totalCount
      );

      return {
        xpEarned,
        success: true,
      };
    },
  });

  return {
    submitReview: submitReview.mutate,
    submitReviewAsync: submitReview.mutateAsync,
    isLoading: submitReview.isPending,
    isError: submitReview.isError,
  };
}
