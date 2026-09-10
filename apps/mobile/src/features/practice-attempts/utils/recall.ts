import type { PracticeResponseInput } from '@/features/practice-attempts/types/practiceAttempt.types';

export function normalizeRecallAnswer(value: string) {
  // Use locale-independent casing so answers behave consistently across
  // devices (for example, Turkish locale rules must not make i/I mismatch).
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

export function getSpellingHint(expected: string, actual: string) {
  const expectedLetters = Array.from(expected.trim().toUpperCase());
  const actualLetters = Array.from(actual.trim().toUpperCase());
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
  hintCount = 0,
) {
  const existing = current.find((response) => response.memoryItemId === memoryItemId);
  const effectiveHintCount = Math.max(hintCount, existing?.hintCount ?? 0);
  const nextResponse: PracticeResponseInput = {
    memoryItemId,
    isCorrect,
    attemptCount: (existing?.attemptCount ?? 0) + 1,
    responseMs,
    ...(effectiveHintCount > 0 ? { hintCount: Math.max(0, Math.min(3, effectiveHintCount)) } : {}),
  };

  return existing
    ? current.map((response) => response.memoryItemId === memoryItemId ? nextResponse : response)
    : [...current, nextResponse];
}
