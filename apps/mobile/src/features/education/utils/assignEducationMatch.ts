import type { EducationMatchingAnswerPair } from '../types/question.types';

export function assignEducationMatch(
  matches: readonly EducationMatchingAnswerPair[],
  leftOptionId: string,
  matchTargetId: string,
): EducationMatchingAnswerPair[] {
  return [
    ...matches.filter(match => match.leftOptionId !== leftOptionId && match.matchTargetId !== matchTargetId),
    { leftOptionId, matchTargetId },
  ];
}
