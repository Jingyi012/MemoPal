import { MAX_REVIEW_ROUND } from '@/features/palace/shared/constants/config';
import type { LessonProgress, ReviewSchedule } from '@/features/palace/shared/types/lesson.types';

export type IntervalUnit = 'minutes' | 'hours' | 'days';

export interface IntervalConfig {
  value: number;
  unit: IntervalUnit;
}

export const REVIEW_INTERVALS: Record<number, IntervalConfig> = {
  1: { value: 1, unit: 'days' },
  2: { value: 3, unit: 'days' },
  3: { value: 7, unit: 'days' },
  4: { value: 30, unit: 'days' },
};

export function calculateNextDueDate(fromDate: string | Date, config: IntervalConfig): Date {
  const date = new Date(fromDate);

  switch (config.unit) {
    case 'minutes':
      date.setMinutes(date.getMinutes() + config.value);
      break;
    case 'hours':
      date.setHours(date.getHours() + config.value);
      break;
    case 'days':
      date.setDate(date.getDate() + config.value);
      break;
  }

  return date;
}

export const LATE_THRESHOLD = 24 * 60 * 60 * 1000;

export function getNextReview(schedule?: ReviewSchedule[]): ReviewSchedule | null {
  if (!schedule || schedule.length === 0) return null;
  return schedule.find((review) => !review.completed) ?? null;
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

export function getMasteryLevel(schedule?: ReviewSchedule[]): LessonProgress['masteryLevel'] {
  if (!schedule || schedule.length === 0) return 'new';

  const total = schedule.length;
  const completed = schedule.filter((review) => review.completed).length;

  if (completed === 0) return 'new';
  if (completed >= total) return 'mastered';
  if (completed >= Math.ceil(total / 2)) return 'reviewing';
  return 'learning';
}

export function getRetentionRate(schedule: ReviewSchedule[]): number {
  const total: number = MAX_REVIEW_ROUND;
  const completed = schedule.filter((review) => review.completed).length;
  if (total === 0) return 0;
  return Math.min(100, 10 + (completed / total) * 90);
}
