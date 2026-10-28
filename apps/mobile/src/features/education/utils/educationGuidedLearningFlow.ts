import type { EducationAttemptAnswerDto } from '@/features/education/types/question.types';

export type EducationGuidedCheckPayload = Readonly<{
  requestId: string;
  expectedVersion: number;
  answer: EducationAttemptAnswerDto;
}>;
type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };

export function createEducationGuidedSessionQueryKey(userId: string, sessionId: string, classroomId?: string) {
  return ['education', 'guided-learning', userId, classroomId ? 'classroom' : 'public', classroomId ?? null, 'session', sessionId] as const;
}

export function createEducationGuidedCheckPayload(
  requestId: string,
  expectedVersion: number,
  answer: EducationAttemptAnswerDto,
): EducationGuidedCheckPayload {
  const answerCopy = { ...answer } as Mutable<EducationAttemptAnswerDto>;
  if (answer.optionIds) answerCopy.optionIds = [...answer.optionIds];
  if (answer.orderedOptionIds) answerCopy.orderedOptionIds = [...answer.orderedOptionIds];
  if (answer.matches) answerCopy.matches = answer.matches.map(pair => ({ ...pair }));
  return {
    requestId,
    expectedVersion,
    answer: answerCopy,
  };
}

export function createEducationGuidedPlaylist(questionIds: readonly string[], recommendedQuestionId: string | null): string[] {
  const uniqueIds = [...new Set(questionIds)];
  const recommendedIndex = recommendedQuestionId ? uniqueIds.indexOf(recommendedQuestionId) : -1;
  if (recommendedIndex <= 0) return uniqueIds;
  return [...uniqueIds.slice(recommendedIndex), ...uniqueIds.slice(0, recommendedIndex)];
}

export function createEducationGuidedResumePlaylist(
  questions: readonly Readonly<{ questionId: string; attemptCount: number }>[],
  recommendedQuestionId: string | null,
): string[] {
  return createEducationGuidedPlaylist(questions.filter(item => item.attemptCount === 0).map(item => item.questionId), recommendedQuestionId);
}

export type EducationGuidedRefreshDecision = Readonly<{
  mode: 'preserve' | 'rebuild' | 'clear';
  retainPendingCheck: boolean;
  notifyChanged: boolean;
}>;

export function decideEducationGuidedFocusRefresh(
  draftVersion: number,
  serverVersion: number | null,
): EducationGuidedRefreshDecision {
  if (serverVersion === null) return { mode: 'clear', retainPendingCheck: false, notifyChanged: false };
  if (serverVersion === draftVersion) return { mode: 'preserve', retainPendingCheck: true, notifyChanged: false };
  return { mode: 'rebuild', retainPendingCheck: true, notifyChanged: true };
}

export function retainEducationGuidedPendingCheck<T>(
  decision: EducationGuidedRefreshDecision,
  pendingCheck: T | null,
): T | null {
  return decision.retainPendingCheck ? pendingCheck : null;
}

export function getNextEducationGuidedPlaylistQuestion(playlist: readonly string[], currentIndex: number): string | null {
  return playlist[currentIndex + 1] ?? null;
}

export type EducationGuidedCheckGate = { active: boolean; focusEpoch: number; inFlightEpoch: number | null };

export function createEducationGuidedCheckGate(): EducationGuidedCheckGate {
  return { active: false, focusEpoch: 0, inFlightEpoch: null };
}

export function activateEducationGuidedCheckGate(gate: EducationGuidedCheckGate): number {
  gate.active = true;
  gate.focusEpoch++;
  gate.inFlightEpoch = null;
  return gate.focusEpoch;
}

export function deactivateEducationGuidedCheckGate(gate: EducationGuidedCheckGate): void {
  gate.active = false;
  gate.focusEpoch++;
  gate.inFlightEpoch = null;
}

export function isEducationGuidedCheckEpochCurrent(gate: EducationGuidedCheckGate, epoch: number): boolean {
  return gate.active && gate.focusEpoch === epoch;
}

export function claimEducationGuidedCheck(gate: EducationGuidedCheckGate, epoch: number): boolean {
  if (!isEducationGuidedCheckEpochCurrent(gate, epoch) || gate.inFlightEpoch !== null) return false;
  gate.inFlightEpoch = epoch;
  return true;
}

export function releaseEducationGuidedCheck(gate: EducationGuidedCheckGate, epoch: number): void {
  if (gate.inFlightEpoch === epoch) gate.inFlightEpoch = null;
}

export type EducationGuidedAdvanceGate = { locked: boolean };

export function createEducationGuidedAdvanceGate(): EducationGuidedAdvanceGate {
  return { locked: false };
}

export function claimEducationGuidedAdvance(gate: EducationGuidedAdvanceGate): boolean {
  if (gate.locked) return false;
  gate.locked = true;
  return true;
}

export function releaseEducationGuidedAdvance(gate: EducationGuidedAdvanceGate): void {
  gate.locked = false;
}

export function resetEducationGuidedAdvance(gate: EducationGuidedAdvanceGate): void {
  gate.locked = false;
}
