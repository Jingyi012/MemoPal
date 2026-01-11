import { LessonProgress, ReviewSchedule } from '@/types/lesson';

export const XP_REWARDS = {
  FIRST_COMPLETION: 100,
  REVIEW_1_ON_TIME: 50,
  REVIEW_1_LATE: 25,
  REVIEW_2_ON_TIME: 40,
  REVIEW_2_LATE: 20,
  REVIEW_3_ON_TIME: 30,
  REVIEW_3_LATE: 15,
  REVIEW_4_ON_TIME: 20,
  REVIEW_4_LATE: 10,
  MASTERY_BONUS: 100, // When all 4 reviews completed
  STREAK_BONUS: 10, // Per consecutive on-time review
};

export const REVIEW_INTERVALS = {
  REVIEW_1: 24 * 60 * 60 * 1000, // 24 hours in ms
  REVIEW_2: 3 * 24 * 60 * 60 * 1000, // 3 days
  REVIEW_3: 7 * 24 * 60 * 60 * 1000, // 7 days
  REVIEW_4: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const LATE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours grace period

export function createReviewSchedule(completionDate: Date): ReviewSchedule {
  return {
    review1: {
      dueDate: new Date(completionDate.getTime() + REVIEW_INTERVALS.REVIEW_1).toISOString(),
      completed: false,
    },
    review2: {
      dueDate: new Date(
        completionDate.getTime() + REVIEW_INTERVALS.REVIEW_1 + REVIEW_INTERVALS.REVIEW_2
      ).toISOString(),
      completed: false,
    },
    review3: {
      dueDate: new Date(
        completionDate.getTime() +
          REVIEW_INTERVALS.REVIEW_1 +
          REVIEW_INTERVALS.REVIEW_2 +
          REVIEW_INTERVALS.REVIEW_3
      ).toISOString(),
      completed: false,
    },
    review4: {
      dueDate: new Date(
        completionDate.getTime() +
          REVIEW_INTERVALS.REVIEW_1 +
          REVIEW_INTERVALS.REVIEW_2 +
          REVIEW_INTERVALS.REVIEW_3 +
          REVIEW_INTERVALS.REVIEW_4
      ).toISOString(),
      completed: false,
    },
  };
}

export function getNextReview(schedule: ReviewSchedule): keyof ReviewSchedule | null {
  if (!schedule.review1.completed) return 'review1';
  if (!schedule.review2.completed) return 'review2';
  if (!schedule.review3.completed) return 'review3';
  if (!schedule.review4.completed) return 'review4';
  return null;
}

export function isReviewOverdue(dueDate: string, gracePeriodMs: number = LATE_THRESHOLD): boolean {
  const due = new Date(dueDate);
  return new Date().getTime() > due.getTime() + gracePeriodMs;
}

export function isReviewDueSoon(dueDate: string, hoursThreshold: number = 24): boolean {
  const due = new Date(dueDate);
  const timeDiff = due.getTime() - new Date().getTime();
  return timeDiff > 0 && timeDiff <= hoursThreshold * 60 * 60 * 1000;
}

export function calculateReviewXP(
  reviewNumber: 1 | 2 | 3 | 4,
  dueDate: Date,
  completedDate: Date
): number {
  const isOnTime = completedDate.getTime() <= dueDate.getTime() + LATE_THRESHOLD;

  switch (reviewNumber) {
    case 1:
      return isOnTime ? XP_REWARDS.REVIEW_1_ON_TIME : XP_REWARDS.REVIEW_1_LATE;
    case 2:
      return isOnTime ? XP_REWARDS.REVIEW_2_ON_TIME : XP_REWARDS.REVIEW_2_LATE;
    case 3:
      return isOnTime ? XP_REWARDS.REVIEW_3_ON_TIME : XP_REWARDS.REVIEW_3_LATE;
    case 4:
      return isOnTime ? XP_REWARDS.REVIEW_4_ON_TIME : XP_REWARDS.REVIEW_4_LATE;
    default:
      return 0;
  }
}

export function getMasteryLevel(schedule: ReviewSchedule): LessonProgress['masteryLevel'] {
  const completedReviews = [
    schedule.review1.completed,
    schedule.review2.completed,
    schedule.review3.completed,
    schedule.review4.completed,
  ].filter(Boolean).length;

  if (completedReviews === 0) return 'new';
  if (completedReviews === 4) return 'mastered';
  if (completedReviews >= 2) return 'reviewing';
  return 'learning';
}

export function getRetentionRate(schedule: ReviewSchedule): number {
  // Simplified retention calculation based on reviews completed
  const completedReviews = [
    schedule.review1.completed,
    schedule.review2.completed,
    schedule.review3.completed,
    schedule.review4.completed,
  ].filter(Boolean).length;

  // Base retention without reviews: 10%
  // Each review adds: 22.5% (to reach 100% with 4 reviews)
  return 10 + completedReviews * 22.5;
}
