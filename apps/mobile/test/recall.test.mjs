import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSpellingHint,
  normalizeRecallAnswer,
  upsertRecallResponse,
} from '../src/features/practice-attempts/utils/recall.ts';
import {
  buildTechniqueRoute,
  recommendTechnique,
} from '../src/features/memory-composer/utils/techniqueRecommendation.ts';

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

test('recommends the right module for common memory goals', () => {
  assert.equal(recommendTechnique('spelling', 5), 'number-peg');
  assert.equal(recommendTechnique('facts', 3), 'palace');
  assert.equal(recommendTechnique('ordered-list', 11), 'palace');
});

test('builds a handoff route without losing the prepared list', () => {
  const route = buildTechniqueRoute('number-peg', 'Friday spelling', 'spelling', ['rhythm', 'separate']);
  assert.match(route, /^\/number-peg\/create\?/);
  assert.match(route, /title=Friday%20spelling/);
  assert.match(route, /items=%5B%22rhythm%22%2C%22separate%22%5D/);
});
