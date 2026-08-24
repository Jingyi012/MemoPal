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
import {
  parseBulkItems,
  parseComposerGoal,
  parseComposerItems,
  suggestMemoryTitle,
} from '../src/features/memory-composer/utils/composerParams.ts';
import { buildNumberPegItems, buildPegScene } from '../src/features/number-peg/utils/numberPegMap.ts';
import {
  choosePalaceScene,
  getPalaceCapacityMessage,
  getPalaceLoci,
} from '../src/features/palace-scenes/utils/palaceCapacity.ts';

const makeScene = (id, locusCount) => ({
  id,
  name: id,
  description: '',
  imageUrl: '',
  status: 'published',
  isTemplate: true,
  isPremium: false,
  version: 1,
  loci: Array.from({ length: locusCount }, (_, index) => ({
    id: `${id}-${index + 1}`,
    position: index + 1,
    name: `Locus ${index + 1}`,
    xPercent: 50,
    yPercent: 50,
    radiusPercent: 7,
    createdAt: '',
    updatedAt: '',
  })),
  createdAt: '',
  updatedAt: '',
});

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

test('parses a shared composer payload and creates a useful title', () => {
  const items = encodeURIComponent(JSON.stringify(['  planets ', '', 'moons']));

  assert.deepEqual(parseComposerItems(items), ['  planets ', '', 'moons']);
  assert.equal(parseComposerGoal('ordered-list'), 'ordered-list');
  assert.equal(suggestMemoryTitle('ordered-list', ['  planets ', '', 'moons']), 'Memory list · planets + 1 more');
});

test('turns pasted lines into bounded, non-empty memory items', () => {
  assert.deepEqual(
    parseBulkItems('  rhythm\n\n separate\r\ncalendar  ', 2),
    ['rhythm', 'separate'],
  );
});

test('keeps the peg map ordered and makes each scene vivid', () => {
  const pegs = buildNumberPegItems();
  const scene = buildPegScene(2, 'apples');

  assert.equal(pegs.length, 10);
  assert.equal(pegs[0].number, 1);
  assert.equal(pegs[9].number, 10);
  assert.match(scene, /swan/i);
  assert.match(scene, /apples/);
});

test('chooses the smallest Palace that fits and explains overflow clearly', () => {
  const compact = makeScene('compact', 6);
  const roomy = makeScene('roomy', 12);
  const scenes = [roomy, compact];

  assert.equal(choosePalaceScene(scenes, 5).id, 'compact');
  assert.equal(choosePalaceScene(scenes, 8).id, 'roomy');
  assert.equal(choosePalaceScene(scenes, 20).id, 'roomy');
  assert.equal(choosePalaceScene(scenes, 5, 'roomy').id, 'roomy');
  assert.equal(getPalaceLoci(roomy).length, 12);
  assert.equal(
    getPalaceCapacityMessage(15, 12),
    'This list has 15 items, but the largest available Palace has 12 loci. Remove 3 items or create a second memory.',
  );
});
