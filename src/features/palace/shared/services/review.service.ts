import { reviewApi } from '@/features/palace/shared/api/review.api';
import {
  REVIEW_MIN_SECONDS_PER_WORD,
  REVIEW_PASS_THRESHOLD,
  REVIEW_SPEED_BONUS_CAP,
  REVIEW_TARGET_SECONDS_PER_WORD,
} from '@/features/palace/shared/constants/config';
import { SourceType } from '@/enums/sourceType';
import { recordXpEventWithClientEventId } from '@/features/gamification/shared/services/xpEvents.service';
import * as xpConfigService from '@/features/gamification/shared/services/xpConfig.service';
import { lessonProgressApi } from '@/features/palace/shared/api/lessonProgress.api';
import type { ReviewSchedule } from '@/features/palace/shared/types/lesson.types';
import type { DueReviewLessonPreview } from '@/features/palace/shared/types/review.types';
import * as Crypto from 'expo-crypto';

export interface ReviewResult {
  correctCount: number;
  accuracy: number;
  isPassed: boolean;
}

export interface DueReviewSnapshot {
  dueReviews: ReviewSchedule[];
  dueLessons: DueReviewLessonPreview[];
}

export function calculateReviewResults(results: any[], totalSteps: number): ReviewResult {
  const correctCount = results.filter((result) => result.isCorrect).length;
  const accuracy = totalSteps > 0 ? correctCount / totalSteps : 0;
  return { correctCount, accuracy, isPassed: accuracy >= REVIEW_PASS_THRESHOLD };
}

export async function getReviewSchedule(lessonProgressId: string): Promise<ReviewSchedule[]> {
  return (await reviewApi.getByProgressId(lessonProgressId)) ?? [];
}

export async function getDueReviews(): Promise<ReviewSchedule[]> {
  return (await reviewApi.getDueReviews()) ?? [];
}

export async function getDueReviewSnapshot(_limit = 2): Promise<DueReviewSnapshot> {
  const dueReviews = (await reviewApi.getDueReviews()) ?? [];
  // The legacy API does not expose lesson titles on due review rows yet.
  // Keep the query server-authoritative and omit previews until that contract is enriched.
  return { dueReviews, dueLessons: [] as DueReviewLessonPreview[] };
}

export async function completeReview(
  lessonId: string,
  correctCount: number,
  totalCount: number,
  isLearningMode = false,
  elapsedSeconds = 0,
  perWordSeconds: number[] = []
): Promise<{
  xpEarned: number;
  lessonId: string;
  levelUpTo?: number;
  achievedMilestones: string[];
  earnedBadges: string[];
  score: number;
  speedBonusXp: number;
  elapsedSeconds: number;
}> {
  if (isLearningMode) {
    return {
      xpEarned: 0,
      lessonId,
      achievedMilestones: [],
      earnedBadges: [],
      score: 0,
      speedBonusXp: 0,
      elapsedSeconds,
    };
  }

  const xpConfig = await xpConfigService.getXpConfigBySourceType(SourceType.ReviewComplete);
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  const isPassed = accuracy >= REVIEW_PASS_THRESHOLD;
  const minExpectedSeconds = Math.max(totalCount * REVIEW_MIN_SECONDS_PER_WORD, 1);
  const targetSeconds = Math.max(totalCount * REVIEW_TARGET_SECONDS_PER_WORD, minExpectedSeconds);
  const avgPerWordSeconds =
    perWordSeconds.length > 0
      ? perWordSeconds.reduce((acc, seconds) => acc + seconds, 0) / perWordSeconds.length
      : elapsedSeconds / Math.max(totalCount, 1);
  const normalizedElapsedSeconds = Math.max(avgPerWordSeconds * totalCount, minExpectedSeconds);
  const safeElapsedSeconds = Math.max(elapsedSeconds, normalizedElapsedSeconds);
  const speedRatio = Math.max(
    0,
    Math.min(1, (targetSeconds - safeElapsedSeconds) / (targetSeconds - minExpectedSeconds || 1))
  );
  const baseXp = Math.floor((xpConfig?.baseXp ?? 10) + (xpConfig?.variableXp ?? 1) * accuracy);
  const computedSpeedBonusXp = Math.round(REVIEW_SPEED_BONUS_CAP * speedRatio * accuracy);
  const computedXpEarned = Math.max(0, baseXp + computedSpeedBonusXp);
  const speedBonusXp = isPassed ? computedSpeedBonusXp : 0;
  const xpEarned = isPassed ? computedXpEarned : 0;
  const score = Math.round(Math.min(100, accuracy * 80 + speedRatio * 20));

  const progress = await lessonProgressApi.getProgress(lessonId);
  const pendingReview = [...(progress.reviewSchedules ?? [])]
    .filter((review) => !review.completed && !review.isDeleted)
    .sort((a, b) => a.reviewRound - b.reviewRound)[0];
  if (pendingReview) {
    await reviewApi.complete(pendingReview.id, correctCount, totalCount);
  }

  let rewards: { levelUpTo?: number; achievedMilestones: string[]; earnedBadges: string[] } = {
    achievedMilestones: [],
    earnedBadges: [],
  };

  if (isPassed && xpEarned > 0) {
    const xpResult = await recordXpEventWithClientEventId(
      SourceType.ReviewComplete,
      xpEarned,
      Crypto.randomUUID(),
      lessonId,
      { trackActivity: false }
    );
    rewards = {
      levelUpTo: xpResult.levelUpTo,
      achievedMilestones: xpResult.achievedMilestones,
      earnedBadges: xpResult.earnedBadges,
    };
  }

  return {
    xpEarned,
    lessonId,
    ...rewards,
    score,
    speedBonusXp,
    elapsedSeconds: safeElapsedSeconds,
  };
}

export async function getReviewStats() {
  return reviewApi.getStats();
}
