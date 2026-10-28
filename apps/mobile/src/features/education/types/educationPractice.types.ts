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
  isMemoPalStarter: boolean;
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
    studyItems: readonly EducationClassroomLearningContent['objectives'][number]['studyItems'][number][];
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
  correctAnswer?: import('./question.types').EducationAttemptAnswerDto | null;
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

export type EducationGuidedQuestionProgress = Readonly<{
  questionId: string;
  position: number;
  attemptCount: number;
  firstTryCorrect: boolean | null;
  missed: boolean;
  solved: boolean;
  latestCorrect: boolean | null;
}>;

export type EducationGuidedSessionQuestion = Readonly<{
  question: import('./question.types').EducationAttemptQuestion;
  objectiveTitle: string;
  progress: EducationGuidedQuestionProgress;
}>;

export type EducationGuidedLearningSession = Readonly<{
  sessionId: string;
  courseId: string;
  courseTitle: string;
  assessmentId: string;
  assessmentTitle: string;
  assessmentVersion: number;
  version: number;
  startedAtUtc: string;
  completedAtUtc: string | null;
  isComplete: boolean;
  questions: readonly EducationGuidedSessionQuestion[];
  nextQuestionId: string | null;
}>;

export type EducationGuidedLessonProgress = Readonly<{
  assessmentId: string;
  assessmentTitle: string;
  objectives: readonly Readonly<{ objectiveId: string; objectiveTitle: string }>[];
  assessmentVersion: number;
  questionCount: number;
  questionsAttempted: number;
  questionsSolved: number;
  neverSolvedQuestionCount: number;
  latestIncorrectQuestionCount: number;
  isStarted: boolean;
  isComplete: boolean;
  sessionId: string | null;
  sessionVersion: number | null;
  completedAtUtc: string | null;
}>;

export type EducationGuidedCourseProgress = Readonly<{
  courseId: string;
  courseTitle: string;
  lessons: readonly EducationGuidedLessonProgress[];
  completedLessonCount: number;
  nextRecommendedAssessmentId: string | null;
}>;

export type EducationGuidedCheckResult = Readonly<{
  sessionId: string;
  questionId: string;
  isCorrect: boolean;
  explanation: string | null;
  sessionVersion: number;
  isComplete: boolean;
  progress: EducationGuidedQuestionProgress;
  nextQuestionId: string | null;
  replayed: boolean;
  correctAnswer?: import('./question.types').EducationAttemptAnswerDto | null;
}>;

export type EducationClassroomLearningContent = Readonly<{
  courseId: string;
  courseTitle: string;
  assessmentId: string;
  assessmentTitle: string;
  objectives: readonly Readonly<{
    objectiveId: string;
    title: string;
    memoryContentType: string;
    languageCode: string | null;
    studyItems: readonly Readonly<{
      id: string;
      position: number;
      kind: string;
      primary: string;
      secondary: string | null;
      phonetic: string | null;
      extra: string | null;
      languageCode: string | null;
      contentVersion: number;
      reviewStatus: string;
      contentOrigin: string;
    }>[];
  }>[];
}>;
