import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSpellingHint,
  normalizeRecallAnswer,
  upsertRecallResponse,
} from '../src/features/practice-attempts/utils/recall.ts';

test('normalizes recall answers for case and whitespace differences', () => {
  assert.equal(normalizeRecallAnswer('  Solar   System '), 'SOLAR SYSTEM');
});

test('gives a useful first-letter spelling hint', () => {
  assert.equal(getSpellingHint('planet', 'plannet'), 'letter 5 should be “E”.');
  assert.equal(getSpellingHint('planet', 'planetx'), 'the ending — it needs 6 letters.');
});

test('upserts a retry without creating duplicate item responses', () => {
  const first = upsertRecallResponse([], 'item-1', false, 300);
  const retried = upsertRecallResponse(first, 'item-1', true, 220);

  assert.equal(retried.length, 1);
  assert.deepEqual(retried[0], {
    memoryItemId: 'item-1',
    isCorrect: true,
    attemptCount: 2,
    responseMs: 220,
  });
});
