import { reviewApi } from '@/api/review';
import {
  REVIEW_MIN_SECONDS_PER_WORD,
  REVIEW_PASS_THRESHOLD,
  REVIEW_SPEED_BONUS_CAP,
  REVIEW_TARGET_SECONDS_PER_WORD,
} from '@/constants/config';
import { SourceType } from '@/enums/sourceType';
import { createReviewRepository } from '@/repositories/review.repo';
import * as xpConfigService from '@/services/xpConfig.service';
import { ReviewSchedule } from '@/types/lesson';

const reviewRepository = createReviewRepository();

export interface ReviewResult {
  correctCount: number;
  accuracy: number;
  isPassed: boolean;
}

/**
 * Calculate review results from answers
 * Pure function - can be used in components for real-time feedback or summary
 */
export function calculateReviewResults(results: any[], totalSteps: number): ReviewResult {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const accuracy = totalSteps > 0 ? correctCount / totalSteps : 0;
  return {
    correctCount,
    accuracy,
    isPassed: accuracy >= REVIEW_PASS_THRESHOLD,
  };
}

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
  isLearningMode: boolean = false,
  elapsedSeconds: number = 0,
  perWordSeconds: number[] = []
): Promise<{ xpEarned: number; lessonId: string; levelUpTo?: number; achievedMilestones: string[]; earnedBadges: string[]; score: number; speedBonusXp: number; elapsedSeconds: number }> {
  if (isLearningMode)
    return { xpEarned: 0, lessonId, achievedMilestones: [], earnedBadges: [], score: 0, speedBonusXp: 0, elapsedSeconds };

  // 1. Calculate XP (Logic stays in service or moved to a utility)
  const xpConfig = await xpConfigService.getXpConfigBySourceType(SourceType.ReviewComplete);
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

  const minExpectedSeconds = Math.max(totalCount * REVIEW_MIN_SECONDS_PER_WORD, 1);
  const targetSeconds = Math.max(totalCount * REVIEW_TARGET_SECONDS_PER_WORD, minExpectedSeconds);
  const avgPerWordSeconds =
    perWordSeconds.length > 0
      ? perWordSeconds.reduce((acc, sec) => acc + sec, 0) / perWordSeconds.length
      : elapsedSeconds / Math.max(totalCount, 1);
  const normalizedElapsedSeconds = Math.max(avgPerWordSeconds * totalCount, minExpectedSeconds);
  const safeElapsedSeconds = Math.max(elapsedSeconds, normalizedElapsedSeconds);
  const speedRatio = Math.max(0, Math.min(1, (targetSeconds - safeElapsedSeconds) / (targetSeconds - minExpectedSeconds || 1)));

  const baseXp = Math.floor((xpConfig?.baseXp ?? 10) + (xpConfig?.variableXp ?? 1) * accuracy);
  const speedBonusXp = Math.round(REVIEW_SPEED_BONUS_CAP * speedRatio * accuracy);
  const xpEarned = Math.max(0, baseXp + speedBonusXp);

  // 100-point weighted score: 80% accuracy + 20% speed
  const score = Math.round(Math.min(100, accuracy * 80 + speedRatio * 20));

  // 2. Perform local update
  const rewards = await reviewRepository.updateLessonProgressAfterReview(
    lessonId,
    xpEarned,
    correctCount,
    totalCount
  );

  return { xpEarned, lessonId, ...rewards, score, speedBonusXp, elapsedSeconds: safeElapsedSeconds };
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
