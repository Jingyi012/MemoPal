export type EducationQuestionOption = Readonly<{
  id: string;
  label: string;
}>;

export type SingleChoiceQuestion = Readonly<{
  id: string;
  prompt: string;
  type: 'single-choice';
  options: readonly EducationQuestionOption[];
}>;

export type MultipleSelectQuestion = Readonly<{
  id: string;
  prompt: string;
  type: 'multiple-select';
  options: readonly EducationQuestionOption[];
}>;

export type OrderingQuestion = Readonly<{
  id: string;
  prompt: string;
  type: 'ordering';
  options: readonly EducationQuestionOption[];
}>;

export type MatchingQuestion = Readonly<{
  id: string;
  prompt: string;
  type: 'matching';
  options: readonly EducationQuestionOption[];
  matchTargets: readonly EducationQuestionOption[];
}>;

export type TrueFalseQuestion = Readonly<{
  id: string;
  prompt: string;
  type: 'true-false';
}>;

export type FillBlankQuestion = Readonly<{
  id: string;
  prompt: string;
  type: 'fill-blank';
  fillMode: 'text' | 'number';
}>;

export type WrittenResponseQuestion = Readonly<{
  id: string;
  prompt: string;
  type: 'written-response';
}>;

export type PhotoResponseQuestion = Readonly<{ id: string; prompt: string; type: 'photo-response' }>;
export type VoiceResponseQuestion = Readonly<{ id: string; prompt: string; type: 'voice-response' }>;

export type EducationQuestion =
  | SingleChoiceQuestion
  | MultipleSelectQuestion
  | OrderingQuestion
  | MatchingQuestion
  | TrueFalseQuestion
  | FillBlankQuestion
  | WrittenResponseQuestion
  | PhotoResponseQuestion
  | VoiceResponseQuestion;

export type SingleChoiceAnswer = Readonly<{
  type: 'single-choice';
  optionId: string | null;
}>;

export type MultipleSelectAnswer = Readonly<{
  type: 'multiple-select';
  optionIds: readonly string[];
}>;

export type OrderingAnswer = Readonly<{
  type: 'ordering';
  orderedOptionIds: readonly string[];
}>;

export type EducationMatchingAnswerPair = Readonly<{
  leftOptionId: string;
  matchTargetId: string;
}>;

export type MatchingAnswer = Readonly<{
  type: 'matching';
  matches: readonly EducationMatchingAnswerPair[];
}>;

export type TrueFalseAnswer = Readonly<{
  type: 'true-false';
  value: boolean | null;
}>;

export type FillBlankAnswer = Readonly<{
  type: 'fill-blank';
  text: string;
}>;

export type WrittenResponseAnswer = Readonly<{
  type: 'written-response';
  text: string;
}>;

export type PhotoResponseAnswer = Readonly<{
  type: 'photo-response';
  photoAttachmentId: string | null;
  localUri?: string;
}>;

export type VoiceResponseAnswer = Readonly<{
  type: 'voice-response';
  audioAttachmentId: string | null;
  localUri?: string;
}>;

export type EducationResponseAttachmentFile = Readonly<{ uri: string; name: string; type: string }>;

export type EducationAnswer =
  | SingleChoiceAnswer
  | MultipleSelectAnswer
  | OrderingAnswer
  | MatchingAnswer
  | TrueFalseAnswer
  | FillBlankAnswer
  | WrittenResponseAnswer
  | PhotoResponseAnswer
  | VoiceResponseAnswer;

export type EducationAttemptQuestion = EducationQuestion & Readonly<{
  objectiveId: string;
  objectiveTitle?: string;
  position: number;
  explanation?: string | null;
}>;

export type EducationAttemptStatus = 'in-progress' | 'submitted';

export type EducationAttemptAnswerDto = Readonly<{
  type: 'single-choice' | 'multiple-select' | 'ordering' | 'matching' | 'true-false' | 'text' | 'number' | 'written-response' | 'photo-response' | 'voice-response';
  optionId?: string | null;
  optionIds?: readonly string[] | null;
  orderedOptionIds?: readonly string[] | null;
  matches?: readonly EducationMatchingAnswerPair[] | null;
  booleanValue?: boolean | null;
  textValue?: string | null;
  numericValue?: string | null;
  photoAttachmentId?: string | null;
  audioAttachmentId?: string | null;
}>;

export type EducationAttemptResponseDto = Readonly<{
  questionId: string;
  answer: EducationAttemptAnswerDto | null;
  score?: number | null;
  feedback?: string | null;
}>;

export type EducationAssessmentAttempt = Readonly<{
  id: string;
  assignmentId: string;
  status: EducationAttemptStatus;
  version: number;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  resultPublished: boolean;
  resultsPublishedAt: string | null;
  score: number | null;
  maxScore: number | null;
  questions: readonly EducationAttemptQuestion[];
  responses: readonly EducationAttemptResponseDto[];
  manualGradingPending: boolean;
  leaderboardEligible?: boolean;
}>;

export type SaveEducationAttemptResponseRequest = Readonly<{
  questionId: string;
  expectedVersion: number;
  clear: boolean;
  answer: EducationAttemptAnswerDto | null;
}>;

export type EducationAttemptSaveResult = Readonly<{
  attemptId: string;
  version: number;
  status: EducationAttemptStatus;
}>;

export type EducationAttemptSubmitResult = Readonly<{
  attemptId: string;
  status: EducationAttemptStatus;
  submittedAt: string | null;
  resultPublished: boolean;
  resultsPublishedAt: string | null;
  score: number | null;
  maxScore: number | null;
  manualGradingPending: boolean;
}>;

export type EducationPracticeCheckResult = Readonly<{
  questionId: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  explanation?: string | null;
}>;
