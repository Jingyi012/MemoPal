import assert from 'node:assert/strict';
import test from 'node:test';
import {
  claimEducationPracticeAdvance,
  claimEducationPracticeCheck,
  createEducationPracticeGate,
  deactivateEducationPracticeGate,
  failEducationPracticeCheck,
  finishEducationPracticeCheck,
  resetEducationPracticeQuestion,
} from '../src/features/education/utils/educationPracticeGate.ts';

test('claims one check at a time, permits retry after failure, and rejects a repeat after a result', () => {
  const gate = createEducationPracticeGate('q1');
  assert.equal(claimEducationPracticeCheck(gate, 'q1'), true);
  assert.equal(claimEducationPracticeCheck(gate, 'q1'), false);
  assert.equal(failEducationPracticeCheck(gate, 'q1'), true);
  assert.equal(claimEducationPracticeCheck(gate, 'q1'), true);
  assert.equal(finishEducationPracticeCheck(gate, 'q1'), true);
  assert.equal(claimEducationPracticeCheck(gate, 'q1'), false);
});

test('claims a single advance and binds the next question to its own checks', () => {
  const gate = createEducationPracticeGate('q1');
  assert.equal(claimEducationPracticeAdvance(gate, 'q1'), true);
  assert.equal(claimEducationPracticeAdvance(gate, 'q1'), false);
  resetEducationPracticeQuestion(gate, 'q2');
  assert.equal(claimEducationPracticeCheck(gate, 'q1'), false);
  assert.equal(claimEducationPracticeCheck(gate, 'q2'), true);
});

test('ignores an in-flight result after the practice session exits', () => {
  const gate = createEducationPracticeGate('q1');
  assert.equal(claimEducationPracticeCheck(gate, 'q1'), true);
  deactivateEducationPracticeGate(gate);
  assert.equal(finishEducationPracticeCheck(gate, 'q1'), false);
  assert.equal(claimEducationPracticeCheck(gate, 'q1'), false);
});
