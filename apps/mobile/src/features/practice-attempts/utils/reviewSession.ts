import type { MemoryItemReviewProgress } from '../types/practiceAttempt.types';

export type ReviewSessionScope = 'due' | 'learn' | 'browse';

/** The server determines eligibility. Keep the original item/peg positions. */
export function selectReviewSessionItems<T extends { id: string }>(
  items: readonly T[], progress: readonly MemoryItemReviewProgress[], scope: ReviewSessionScope,
) {
  if (scope === 'browse') return [...items];
  const eligible = new Set(progress.filter((item) => scope === 'due' ? item.isDue : item.dueAt === null)
    .map((item) => item.memoryItemId));
  return items.filter((item) => eligible.has(item.id));
}

/** Local calendar labels only; this never advances or decides review eligibility. */
export function getReviewTiming(dueAt: string | null, isDue: boolean, now = new Date()) {
  if (!dueAt) return { key: 'newItem' as const, count: 0 };
  const due = new Date(dueAt);
  if (!Number.isFinite(due.getTime())) return { key: 'unavailable' as const, count: 0 };
  const day = (value: Date) => Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  const days = Math.round((day(due) - day(now)) / 86400000);
  if (isDue) return days < 0 ? { key: 'overdueDays' as const, count: -days } : { key: 'dueNow' as const, count: 0 };
  if (days > 1) return { key: 'inDays' as const, count: days };
  if (days === 1) return { key: 'tomorrow' as const, count: 0 };
  return { key: 'laterToday' as const, count: 0 };
}
