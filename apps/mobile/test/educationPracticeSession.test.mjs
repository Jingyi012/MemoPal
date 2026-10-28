import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEducationPracticeSession,
  createEducationPracticeSessionKey,
  educationPracticeSessionReducer,
  getMissedEducationPracticeQuestionIds,
  summarizeEducationPracticeSession,
} from '../src/features/education/utils/educationPracticeSession.ts';

test('separates first-try correct answers, retry successes, missed items, and unresolved items', () => {
  let session = createEducationPracticeSession(['first', 'retry', 'missed']);
  session = educationPracticeSessionReducer(session, { type: 'checked', questionId: 'first', isCorrect: true });
  session = educationPracticeSessionReducer(session, { type: 'checked', questionId: 'retry', isCorrect: false });
  session = educationPracticeSessionReducer(session, { type: 'checked', questionId: 'retry', isCorrect: true });
  session = educationPracticeSessionReducer(session, { type: 'checked', questionId: 'missed', isCorrect: false });

  assert.deepEqual(summarizeEducationPracticeSession(session), { total: 3, firstTryCorrect: 1, retryCorrect: 1, pending: 1, missed: 2 });
  assert.deepEqual(getMissedEducationPracticeQuestionIds(session), ['retry', 'missed']);
});

test('does not count repeat checks as a retry success after a first-try correct answer', () => {
  let session = createEducationPracticeSession(['first']);
  session = educationPracticeSessionReducer(session, { type: 'checked', questionId: 'first', isCorrect: true });
  session = educationPracticeSessionReducer(session, { type: 'checked', questionId: 'first', isCorrect: true });
  assert.deepEqual(summarizeEducationPracticeSession(session), { total: 1, firstTryCorrect: 1, retryCorrect: 0, pending: 0, missed: 0 });
});

test('ignores a stale question result and resets cleanly for missed-only practice', () => {
  let session = createEducationPracticeSession(['one', 'two']);
  session = educationPracticeSessionReducer(session, { type: 'checked', questionId: 'one', isCorrect: false });
  const beforeStale = session;
  assert.equal(educationPracticeSessionReducer(session, { type: 'checked', questionId: 'removed', isCorrect: true }), beforeStale);
  session = educationPracticeSessionReducer(session, { type: 'reset', questionIds: ['one'] });
  assert.deepEqual(summarizeEducationPracticeSession(session), { total: 1, firstTryCorrect: 0, retryCorrect: 0, pending: 1, missed: 0 });
});

test('keys practice state by user, attempt, and question content revision', () => {
  const questionV1 = [{ id: 'q', type: 'single-choice', prompt: 'Old prompt' }];
  const questionV2 = [{ id: 'q', type: 'single-choice', prompt: 'Updated prompt' }];
  const ownerA = createEducationPracticeSessionKey('user-a', 'attempt', questionV1);
  assert.notEqual(createEducationPracticeSessionKey('user-b', 'attempt', questionV1), ownerA);
  assert.notEqual(createEducationPracticeSessionKey('user-a', 'attempt', questionV2), ownerA);
});
