export type EducationPracticeQuestionType =
  | 'single-choice'
  | 'multiple-select'
  | 'ordering'
  | 'matching'
  | 'true-false'
  | 'fill-blank';

export type EducationPracticeFormatCount = Readonly<{
  type: EducationPracticeQuestionType;
  count: number;
}>;

export type EducationPracticeItem = Readonly<{
  attemptId: string;
  assignmentId: string;
  title: string;
  submittedAt: string | null;
  questionCount: number;
  questionTypes: readonly EducationPracticeFormatCount[];
}>;

export type EducationPracticeFormatPreference = 'all' | EducationPracticeQuestionType;

export type EducationPublicCourseSummary = Readonly<{
  id: string;
  title: string;
  authorDisplayName: string;
  publishedAt: string;
  assessmentCount: number;
  questionCount: number;
  isSaved: boolean;
}>;

export type EducationPublicAssessmentSummary = Readonly<{
  id: string;
  title: string;
  publishedAt: string;
  questionCount: number;
  questionTypes: readonly EducationPracticeQuestionType[];
}>;

export type EducationPublicCourseDetail = Readonly<Omit<EducationPublicCourseSummary, 'assessmentCount' | 'questionCount'> & {
  assessments: readonly EducationPublicAssessmentSummary[];
  objectives: readonly Readonly<{
    id: string;
    title: string;
    recommendedMemorySet: Readonly<{ id: string; title: string; goalType: string; techniqueKey: 'palace' | 'number-peg'; description: string | null }> | null;
  }>[];
}>;

export type EducationPublicPracticeQuestion = Readonly<{
  question: import('./question.types').EducationAttemptQuestion;
  objectiveTitle: string;
}>;

export type EducationPublicPracticeAssessment = Readonly<{
  id: string;
  courseId: string;
  title: string;
  publishedAt: string;
  questions: readonly EducationPublicPracticeQuestion[];
}>;

export type EducationPublicPracticeAnswerResult = Readonly<{
  questionId: string;
  isCorrect: boolean;
  explanation: string | null;
}>;

export type EducationPublicPracticeHistoryItem = Readonly<{
  courseId: string;
  courseTitle: string;
  assessmentId: string;
  assessmentTitle: string;
  questionId: string;
  questionPrompt: string;
  objectiveTitle: string;
  lastAnswerCorrect: boolean;
  lastAnsweredAtUtc: string;
}>;
