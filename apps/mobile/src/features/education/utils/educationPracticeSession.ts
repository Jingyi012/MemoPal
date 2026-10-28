export type EducationPracticeQuestionProgress = Readonly<{
  attempts: number;
  missed: boolean;
  firstTryCorrect: boolean | null;
  solvedOnRetry: boolean;
  solved: boolean;
}>;

export type EducationPracticeSessionState = Readonly<{
  questionIds: readonly string[];
  progress: Readonly<Record<string, EducationPracticeQuestionProgress>>;
}>;

export type EducationPracticeSessionAction = Readonly<{ type: 'checked'; questionId: string; isCorrect: boolean } | { type: 'reset'; questionIds: readonly string[] }>;

export function createEducationPracticeSessionKey(sessionIdentity: string, attemptId: string, questions: readonly unknown[]): string {
  return `${sessionIdentity}:${attemptId}:${JSON.stringify(questions)}`;
}

export function createEducationPracticeSession(questionIds: readonly string[]): EducationPracticeSessionState {
  return { questionIds: [...questionIds], progress: {} };
}

export function educationPracticeSessionReducer(state: EducationPracticeSessionState, action: EducationPracticeSessionAction): EducationPracticeSessionState {
  if (action.type === 'reset') return createEducationPracticeSession(action.questionIds);
  if (action.type !== 'checked' || !state.questionIds.includes(action.questionId)) return state;
  const previous = state.progress[action.questionId] ?? { attempts: 0, missed: false, firstTryCorrect: null, solvedOnRetry: false, solved: false };
  const progress = {
    attempts: previous.attempts + 1,
    missed: previous.missed || !action.isCorrect,
    firstTryCorrect: previous.attempts === 0 ? action.isCorrect : previous.firstTryCorrect,
    solvedOnRetry: previous.solvedOnRetry || (action.isCorrect && previous.attempts > 0),
    solved: previous.solved || action.isCorrect,
  };
  return { ...state, progress: { ...state.progress, [action.questionId]: progress } };
}

export function getMissedEducationPracticeQuestionIds(state: EducationPracticeSessionState): string[] {
  return state.questionIds.filter(id => state.progress[id]?.missed === true);
}

export function getPendingEducationPracticeQuestionCount(state: EducationPracticeSessionState): number {
  return state.questionIds.filter(id => !state.progress[id]?.solved).length;
}

export function summarizeEducationPracticeSession(state: EducationPracticeSessionState) {
  const progress = Object.values(state.progress);
  const firstTryCorrect = progress.filter(item => item.firstTryCorrect === true).length;
  const retryCorrect = progress.filter(item => item.solvedOnRetry && item.firstTryCorrect !== true).length;
  return { total: state.questionIds.length, firstTryCorrect, retryCorrect, pending: getPendingEducationPracticeQuestionCount(state), missed: getMissedEducationPracticeQuestionIds(state).length };
}
