import type { PracticeResponseInput } from '@/features/practice-attempts/types/practiceAttempt.types';

export function normalizeRecallAnswer(value: string) {
  // Use locale-independent casing so answers behave consistently across
  // devices (for example, Turkish locale rules must not make i/I mismatch).
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/[‐‑‒–—―-]+/gu, ' ')
    .replace(/[',’]/gu, '')
    .replace(/[,.!?;:()[\]{}，。！？；：、（）【】《》]+/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ')
    .toUpperCase();
}

/**
 * Accept normal typing variation while keeping answer checking conservative.
 * Only one single-character typo is tolerated per answer, and only for
 * English words long enough that a one-character difference is meaningful.
 */
export function isRecallAnswerCorrect(expected: string, actual: string) {
  const normalizedExpected = normalizeRecallAnswer(expected);
  const normalizedActual = normalizeRecallAnswer(actual);

  if (!normalizedExpected || !normalizedActual) return false;
  if (normalizedExpected === normalizedActual) return true;

  const expectedWords = normalizedExpected.split(' ');
  const actualWords = normalizedActual.split(' ');
  if (expectedWords.length !== actualWords.length) return false;

  let toleratedTypos = 0;
  for (let index = 0; index < expectedWords.length; index += 1) {
    const expectedWord = expectedWords[index];
    const actualWord = actualWords[index];
    if (expectedWord === actualWord) continue;
    if (
      toleratedTypos > 0 ||
      expectedWord.length < 5 ||
      actualWord.length < 4 ||
      !/^[A-Z]+$/u.test(expectedWord) ||
      !/^[A-Z]+$/u.test(actualWord) ||
      getEditDistance(expectedWord, actualWord) > 1
    ) {
      return false;
    }
    toleratedTypos += 1;
  }

  return true;
}

function getEditDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal, previous[rightIndex], previous[rightIndex - 1]) + 1;
      diagonal = above;
    }
  }

  return previous[right.length];
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
