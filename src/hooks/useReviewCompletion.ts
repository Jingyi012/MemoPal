import { SourceType } from '@/enums/sourceType';
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
      isLearningMode = false,
    }: {
      userId: string;
      lessonId: string;
      correctCount: number;
      totalCount: number;
      isLearningMode: boolean;
    }) => {
      if (isLearningMode) {
        return {
          xpEarned: 0,
          success: true,
        };
      }

      // Get XP config for review completion
      const xpConfig = await xpConfigRepo.getBySourceType(SourceType.ReviewComplete);
      const baseXp = xpConfig?.baseXp ?? 10;
      const variableCp = xpConfig?.variableXp ?? 1;

      // Calculate XP based on accuracy
      const accuracy = correctCount / totalCount;
      const xpEarned = Math.floor(baseXp + variableCp * accuracy);

      // Record XP event
      await recordXpEvent(userId, SourceType.ReviewComplete, xpEarned, lessonId);

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
