import type { DueMemoryReview } from '@/features/practice-attempts/types/practiceAttempt.types';

export type MemoryReviewGroup = {
  review: DueMemoryReview;
  itemCount: number;
};

/**
 * The API returns one scheduled item per memory set. Home and other compact
 * surfaces represent a review session, so keep one row per memory set while
 * retaining how many items are waiting inside it.
 */
export function groupMemoryReviews(reviews: DueMemoryReview[]): MemoryReviewGroup[] {
  const groups = new Map<string, MemoryReviewGroup>();

  reviews.forEach((review) => {
    const current = groups.get(review.memorySetId);
    if (!current) {
      groups.set(review.memorySetId, { review, itemCount: 1 });
      return;
    }

    current.itemCount += 1;
    if (Date.parse(review.dueAt) < Date.parse(current.review.dueAt)) {
      current.review = review;
    }
  });

  return Array.from(groups.values()).sort(
    (left, right) => Date.parse(left.review.dueAt) - Date.parse(right.review.dueAt),
  );
}
