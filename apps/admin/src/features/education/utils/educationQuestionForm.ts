import type { EducationQuestionDto, EducationQuestionRequest } from '../../../types/educationAuthoring';

export interface QuestionFormValue {
  id?: string | null;
  prompt: string;
  explanation?: string | null;
  type: EducationQuestionDto['type'];
  fillMode?: 'text' | 'number';
  maxScore: number;
  objectiveId: string;
  options?: Array<{ id: string; label: string }>;
  correctOptionId?: string | null;
  correctOptionIds?: string[];
  correctSequenceIds?: string[];
  matchingPairs?: Array<{ left: { id: string; label: string }; right: { id: string; label: string } }>;
  correctBooleanAnswer?: boolean | null;
  allowedTextAnswers?: string;
  trimTextAnswers?: boolean;
  ignoreCase?: boolean;
  allowedNumericAnswers?: string;
  numericTolerance?: number;
  gradingRubric?: string | null;
}

export interface AssessmentFormValue { title: string; questions: QuestionFormValue[]; }

function parseNumericAnswers(value: string | undefined): number[] {
  return (value ?? '').split(',').map(item => item.trim()).filter(Boolean).map(Number);
}

export function toEducationQuestionRequests(value: AssessmentFormValue): EducationQuestionRequest[] {
  return value.questions.map(question => ({
    id: question.id,
    prompt: question.prompt,
    explanation: question.explanation ?? null,
    type: question.type,
    fillMode: question.type === 'fill-blank' ? question.fillMode ?? null : null,
    maxScore: question.maxScore,
    objectiveId: question.objectiveId,
    options: question.type === 'single-choice' || question.type === 'multiple-select' || question.type === 'ordering' ? (question.options ?? []) : [],
    correctOptionId: question.type === 'single-choice' ? question.correctOptionId ?? null : null,
    correctOptionIds: question.type === 'multiple-select' ? question.correctOptionIds ?? [] : [],
    correctSequenceIds: question.type === 'ordering' ? question.correctSequenceIds ?? [] : [],
    matchingPairs: question.type === 'matching' ? question.matchingPairs ?? [] : [],
    correctBooleanAnswer: question.type === 'true-false' ? question.correctBooleanAnswer ?? null : null,
    allowedTextAnswers: question.type === 'fill-blank' && question.fillMode === 'text' ? (question.allowedTextAnswers ?? '').split(/\r?\n/).filter(x => x.trim().length > 0) : [],
    trimTextAnswers: question.trimTextAnswers ?? false,
    ignoreCase: question.ignoreCase ?? false,
    allowedNumericAnswers: question.type === 'fill-blank' && question.fillMode === 'number' ? parseNumericAnswers(question.allowedNumericAnswers) : [],
    numericTolerance: question.numericTolerance ?? 0,
    gradingRubric: question.type === 'written-response' || question.type === 'photo-response' || question.type === 'voice-response' ? question.gradingRubric ?? null : null,
  }));
}
