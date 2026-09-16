import type { DueMemoryReview } from '../types/practiceAttempt.types';

/** Presentation only: the server still decides whether an item is due. */
export function isReviewOverdue(
  review: Pick<DueMemoryReview, 'dueAt' | 'intervalDays' | 'lastResultCorrect'>,
  now = new Date(),
) {
  const due = new Date(review.dueAt);
  if (review.intervalDays === 0 && !review.lastResultCorrect) return due.getTime() < now.getTime();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due.getTime() < startOfToday.getTime();
}
