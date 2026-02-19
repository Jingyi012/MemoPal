import { reviewApi } from '@/api/review';
import { SourceType } from '@/enums/sourceType';
import { createReviewRepository } from '@/repositories/review.repo';
import * as xpConfigService from '@/services/xpConfig.service';
import { ReviewSchedule } from '@/types/lesson';
const reviewRepository = createReviewRepository();

/**
 * Get review schedule for a lesson with sync
 */
export async function getReviewSchedule(lessonProgressId: string): Promise<ReviewSchedule[]> {
  try {
    const remote = await reviewApi.getByProgressId(lessonProgressId);
    if (remote?.length) {
      await reviewRepository.upsertMany(remote);
    }
  } catch (error) {
    console.warn('Failed to sync reviews from backend:', error);
  }

  return reviewRepository.getReviewSchedule(lessonProgressId);
}

/**
 * Get all due reviews for user with sync
 */
export async function getDueReviews(): Promise<ReviewSchedule[]> {
  try {
    const remote = await reviewApi.getDueReviews();
    if (remote?.length) {
      await reviewRepository.upsertMany(remote);
    }
  } catch (error) {
    console.warn('Failed to sync due reviews:', error);
  }

  return reviewRepository.getDueReviews();
}

/**
 * Complete a review (local + queue for sync)
 * Offline-first: mark locally, queue for async sync
 */
export async function completeReview(
  lessonId: string,
  correctCount: number,
  totalCount: number,
  isLearningMode: boolean = false
): Promise<{ xpEarned: number; lessonId: string }> {
  if (isLearningMode) return { xpEarned: 0, lessonId };

  // 1. Calculate XP (Logic stays in service or moved to a utility)
  const xpConfig = await xpConfigService.getXpConfigBySourceType(SourceType.ReviewComplete);
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  const xpEarned = Math.floor((xpConfig?.baseXp ?? 10) + (xpConfig?.variableXp ?? 1) * accuracy);

  // 2. Perform local update
  await reviewRepository.updateLessonProgressAfterReview(
    lessonId,
    xpEarned,
    correctCount,
    totalCount
  );

  return { xpEarned, lessonId };
}

/**
 * Get review statistics with sync
 */
export async function getReviewStats() {
  try {
    return await reviewApi.getStats();
  } catch (error) {
    console.warn('Using local stats fallback.');
    return reviewRepository.getReviewStats();
  }
}
