import type { EducationQuestionDto } from '../../../types/educationAuthoring';
import type { QuestionFormValue } from './educationQuestionForm';

export type EducationQuestionPreview = Readonly<{
  prompt: string;
  type: EducationQuestionDto['type'];
  fillMode?: QuestionFormValue['fillMode'];
  maxScore: number;
  options: readonly string[];
  matchingTargets: readonly string[];
  explanation: string | null;
}>;

/** Explicitly projects teacher form values into only the fields shown in the student preview. */
export function toEducationQuestionPreview(question: QuestionFormValue): EducationQuestionPreview {
  const hasOptions = question.type === 'single-choice' || question.type === 'multiple-select' || question.type === 'ordering';
  return {
    prompt: question.prompt,
    type: question.type,
    fillMode: question.type === 'fill-blank' ? question.fillMode : undefined,
    maxScore: question.maxScore,
    options: hasOptions
      ? (question.options ?? []).map(option => option.label)
      : question.type === 'matching' ? (question.matchingPairs ?? []).map(pair => pair.left.label) : [],
    matchingTargets: question.type === 'matching' ? (question.matchingPairs ?? []).map(pair => pair.right.label) : [],
    explanation: question.explanation?.trim() || null,
  };
}
