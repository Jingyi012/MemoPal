import type { PracticeResponseInput } from '@/features/practice-attempts/types/practiceAttempt.types';

export function normalizeRecallAnswer(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleUpperCase();
}

export function getSpellingHint(expected: string, actual: string) {
  const expectedLetters = Array.from(expected.trim().toLocaleUpperCase());
  const actualLetters = Array.from(actual.trim().toLocaleUpperCase());
  const mismatch = expectedLetters.findIndex((letter, index) => letter !== actualLetters[index]);
  if (mismatch >= 0) return `letter ${mismatch + 1} should be “${expectedLetters[mismatch]}”.`;
  if (expectedLetters.length !== actualLetters.length) return `the ending — it needs ${expectedLetters.length} letters.`;
  return 'the letter pattern once more.';
}

export function upsertRecallResponse(
  current: PracticeResponseInput[],
  memoryItemId: string,
  isCorrect: boolean,
  responseMs: number,
) {
  const existing = current.find((response) => response.memoryItemId === memoryItemId);
  const nextResponse: PracticeResponseInput = {
    memoryItemId,
    isCorrect,
    attemptCount: (existing?.attemptCount ?? 0) + 1,
    responseMs,
  };

  return existing
    ? current.map((response) => response.memoryItemId === memoryItemId ? nextResponse : response)
    : [...current, nextResponse];
}
