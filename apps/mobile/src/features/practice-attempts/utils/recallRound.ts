import type { PracticeResponseInput } from '../types/practiceAttempt.types';

export const MAX_RECALL_ATTEMPTS = 3;

/** A resumed round keeps its original subset and reinforcement visits. */
export function getSavedReviewItemIds(
  items: readonly { id: string }[], saved: string[] | undefined, index: number,
) {
  if (!saved?.length || !Number.isInteger(index) || index < 0 || index >= saved.length) return null;
  const valid = new Set(items.map((item) => item.id));
  const counts = new Map<string, number>();
  for (const id of saved) {
    if (!valid.has(id)) return null;
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (counts.get(id)! > MAX_RECALL_ATTEMPTS) return null;
  }
  return new Set(saved);
}

/** Resume the exact queue, including up to two reinforcement visits per item. */
export function restoreRecallQueue(items: readonly { id: string }[], saved?: string[]) {
  const ids = items.map((item) => item.id);
  if (!Array.isArray(saved)) return ids;
  const counts = new Map<string, number>();
  for (const id of saved) counts.set(id, (counts.get(id) ?? 0) + 1);
  return saved.length <= ids.length * MAX_RECALL_ATTEMPTS &&
    counts.size === ids.length && ids.every((id) => (counts.get(id) ?? 0) >= 1) &&
    [...counts.values()].every((count) => count <= MAX_RECALL_ATTEMPTS)
    ? saved : ids;
}

/** Insert after two other questions when available; short rounds use the tail. */
export function reinforceRecallQueue(
  order: readonly string[],
  index: number,
  response: PracticeResponseInput,
  usedHint: boolean,
) {
  if ((response.isCorrect && !usedHint) || response.attemptCount >= MAX_RECALL_ATTEMPTS)
    return [...order];
  const next = [...order];
  next.splice(Math.min(index + 3, next.length), 0, response.memoryItemId);
  return next;
}
