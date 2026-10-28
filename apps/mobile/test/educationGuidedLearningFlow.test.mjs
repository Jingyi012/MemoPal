import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activateEducationGuidedCheckGate,
  claimEducationGuidedAdvance,
  claimEducationGuidedCheck,
  createEducationGuidedAdvanceGate,
  createEducationGuidedCheckGate,
  createEducationGuidedCheckPayload,
  createEducationGuidedPlaylist,
  createEducationGuidedResumePlaylist,
  createEducationGuidedSessionQueryKey,
  decideEducationGuidedFocusRefresh,
  retainEducationGuidedPendingCheck,
  deactivateEducationGuidedCheckGate,
  getNextEducationGuidedPlaylistQuestion,
  isEducationGuidedCheckEpochCurrent,
  releaseEducationGuidedCheck,
  releaseEducationGuidedAdvance,
  resetEducationGuidedAdvance,
} from '../src/features/education/utils/educationGuidedLearningFlow.ts';

test('captures an immutable retry payload with only the strict API request fields', () => {
  const answer = { type: 'ordering', orderedOptionIds: ['one', 'two'] };
  const pending = createEducationGuidedCheckPayload('request-1', 8, answer);
  answer.orderedOptionIds.reverse();
  assert.deepEqual(pending, { requestId: 'request-1', expectedVersion: 8, answer: { type: 'ordering', orderedOptionIds: ['one', 'two'] } });
  assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(pending))).sort(), ['answer', 'expectedVersion', 'requestId']);
  assert.deepEqual(pending, JSON.parse(JSON.stringify(pending)), 'retries send the identical request payload');
});

test('uses a finite playlist for missed questions and a full replay, including previously solved questions', () => {
  const all = createEducationGuidedPlaylist(['q1', 'q2', 'q3'], 'q2');
  assert.deepEqual(all, ['q2', 'q3', 'q1']);
  assert.equal(getNextEducationGuidedPlaylistQuestion(all, 0), 'q3');
  assert.equal(getNextEducationGuidedPlaylistQuestion(all, 1), 'q1');
  assert.equal(getNextEducationGuidedPlaylistQuestion(all, 2), null);
  const missedOnly = createEducationGuidedPlaylist(['q2', 'q3'], 'q2');
  assert.deepEqual(missedOnly, ['q2', 'q3']);
});

test('resuming an incomplete record only queues unanswered questions', () => {
  assert.deepEqual(createEducationGuidedResumePlaylist([
    { questionId: 'q1', attemptCount: 1 },
    { questionId: 'q2', attemptCount: 0 },
    { questionId: 'q3', attemptCount: 0 },
  ], 'q2'), ['q2', 'q3']);
});

test('focus refresh preserves same-version drafts and rebuilds with a notice after server progress changes', () => {
  assert.deepEqual(decideEducationGuidedFocusRefresh(4, 4), {
    mode: 'preserve', retainPendingCheck: true, notifyChanged: false,
  });
  assert.deepEqual(decideEducationGuidedFocusRefresh(4, 5), {
    mode: 'rebuild', retainPendingCheck: true, notifyChanged: true,
  });
});

test('unavailable focus refresh clears local pending receipt instead of retaining it', () => {
  assert.deepEqual(decideEducationGuidedFocusRefresh(4, null), {
    mode: 'clear', retainPendingCheck: false, notifyChanged: false,
  });
  const pendingReceipt = { questionId: 'q2', payload: { requestId: 'same-id', expectedVersion: 4, answer: { type: 'short-answer', value: 'x' } } };
  const sameVersion = decideEducationGuidedFocusRefresh(4, 4);
  const changedVersion = decideEducationGuidedFocusRefresh(4, 5);
  assert.equal(retainEducationGuidedPendingCheck(sameVersion, pendingReceipt), pendingReceipt);
  assert.equal(retainEducationGuidedPendingCheck(changedVersion, pendingReceipt), pendingReceipt);
  assert.equal(retainEducationGuidedPendingCheck(decideEducationGuidedFocusRefresh(4, null), pendingReceipt), null);
});

test('claims a single next action until the next question render', () => {
  const gate = createEducationGuidedAdvanceGate();
  assert.equal(claimEducationGuidedAdvance(gate), true);
  assert.equal(claimEducationGuidedAdvance(gate), false);
  releaseEducationGuidedAdvance(gate);
  assert.equal(claimEducationGuidedAdvance(gate), true);
});

test('resets the advance gate for consecutive replay rounds of the same single question', () => {
  const gate = createEducationGuidedAdvanceGate();
  const questionId = 'only-question';

  for (let round = 0; round < 2; round++) {
    assert.equal(claimEducationGuidedAdvance(gate), true, `round ${round + 1} can advance to summary`);
    assert.equal(claimEducationGuidedAdvance(gate), false, 'summary transition stays one-shot');
    if (round === 0) {
      resetEducationGuidedAdvance(gate);
      assert.equal(questionId, 'only-question', 'replay starts with the same question id');
    }
  }
});

test('prevents same-tick duplicate checks and invalidates old focus responses after blur and refocus', () => {
  const gate = createEducationGuidedCheckGate();
  const firstEpoch = activateEducationGuidedCheckGate(gate);
  assert.equal(claimEducationGuidedCheck(gate, firstEpoch), true);
  assert.equal(claimEducationGuidedCheck(gate, firstEpoch), false);
  deactivateEducationGuidedCheckGate(gate);
  const resumedEpoch = activateEducationGuidedCheckGate(gate);
  assert.equal(isEducationGuidedCheckEpochCurrent(gate, firstEpoch), false);
  assert.equal(isEducationGuidedCheckEpochCurrent(gate, resumedEpoch), true);
  assert.equal(claimEducationGuidedCheck(gate, resumedEpoch), true);
  releaseEducationGuidedCheck(gate, firstEpoch);
  assert.equal(claimEducationGuidedCheck(gate, resumedEpoch), false, 'old request cleanup cannot unlock a newer in-flight check');
  releaseEducationGuidedCheck(gate, resumedEpoch);
  assert.equal(claimEducationGuidedCheck(gate, resumedEpoch), true);
});

test('scopes persisted session cache by user, session, and classroom access context', () => {
  assert.notDeepEqual(createEducationGuidedSessionQueryKey('user-a', 'session-1'), createEducationGuidedSessionQueryKey('user-b', 'session-1'));
  assert.notDeepEqual(createEducationGuidedSessionQueryKey('user-a', 'session-1'), createEducationGuidedSessionQueryKey('user-a', 'session-2'));
  assert.notDeepEqual(createEducationGuidedSessionQueryKey('user-a', 'session-1'), createEducationGuidedSessionQueryKey('user-a', 'session-1', 'class-a'));
  assert.notDeepEqual(createEducationGuidedSessionQueryKey('user-a', 'session-1', 'class-a'), createEducationGuidedSessionQueryKey('user-a', 'session-1', 'class-b'));
});
