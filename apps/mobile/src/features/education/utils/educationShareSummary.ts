import type { EducationAttemptQuestion } from '../types/question.types';

type ShareQuestionType = EducationAttemptQuestion['type'];

export type EducationShareSummaryLabels = Readonly<{
  completed: (questionCount: number, formats: string) => string;
  privacyNote: string;
  questionTypes: Readonly<Record<ShareQuestionType, string>>;
}>;

export function buildEducationShareSummary(
  questionTypes: readonly ShareQuestionType[],
  labels: EducationShareSummaryLabels,
): string {
  const counts = new Map<ShareQuestionType, number>();
  for (const type of questionTypes) counts.set(type, (counts.get(type) ?? 0) + 1);

  const formats = [...counts]
    .map(([type, count]) => `${count} ${labels.questionTypes[type]}`)
    .join(', ');
  return `${labels.completed(questionTypes.length, formats)}\n${labels.privacyNote}`;
}

export function buildEducationPracticeHistoryShareSummary(
  recentQuestionCount: number,
  labels: Readonly<{ summary: (count: number) => string; privacyNote: string }>,
): string {
  const safeCount = Number.isFinite(recentQuestionCount)
    ? Math.max(0, Math.floor(recentQuestionCount))
    : 0;
  return `${labels.summary(safeCount)}\n${labels.privacyNote}`;
}
