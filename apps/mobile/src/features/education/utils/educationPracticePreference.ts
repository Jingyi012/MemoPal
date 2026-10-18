import type { EducationPracticeFormatPreference, EducationPracticeQuestionType } from '@/features/education/types/educationPractice.types';

const FORMAT_TYPES: readonly EducationPracticeQuestionType[] = [
  'single-choice', 'multiple-select', 'ordering', 'matching', 'true-false', 'fill-blank',
];

export function parsePracticeFormatPreference(value: string | null): EducationPracticeFormatPreference {
  if (value === 'all' || FORMAT_TYPES.includes(value as EducationPracticeQuestionType)) return value as EducationPracticeFormatPreference;
  return 'all';
}
