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
import {
  buildAllNumberPegItems,
  buildNumberPegItems,
  buildPegScene,
  getUnlockedPegCount,
} from '../src/features/number-peg/utils/numberPegMap.ts';
import {
  choosePalaceScene,
  getPalaceCapacityMessage,
  getPalaceLoci,
} from '../src/features/palace-scenes/utils/palaceCapacity.ts';
import { groupMemoryReviews } from '../src/features/practice-attempts/utils/reviewGrouping.ts';
import {
  createPalaceAssociation,
  ensurePalaceAssociations,
  getAssociationText,
} from '../src/features/palace-scenes/utils/palaceAuthoring.ts';
import { isNetworkStateOnline } from '../src/core/network/networkState.ts';

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
  assert.equal(normalizeRecallAnswer('iPhone'), normalizeRecallAnswer('iphone'));
  assert.equal(normalizeRecallAnswer('Mixed Case'), normalizeRecallAnswer('MIXED CASE'));
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

test('keeps Palace associations vivid and editable per locus', () => {
  const loci = [{ name: 'front door' }, { name: 'blue sofa' }];

  assert.equal(
    createPalaceAssociation('mitosis', 'front door'),
    'mitosis comes alive at the front door.',
  );
  assert.deepEqual(
    ensurePalaceAssociations(['mitosis', 'meiosis'], loci, ['Custom scene']),
    ['Custom scene', 'meiosis comes alive at the blue sofa.'],
  );
  assert.equal(
    getAssociationText(['  '], 0, 'mitosis', loci[0]),
    'mitosis comes alive at the front door.',
  );
});

test('recommends the right module for common memory goals', () => {
  assert.equal(recommendTechnique('spelling', 5), 'number-peg');
  assert.equal(recommendTechnique('facts', 3), 'palace');
  assert.equal(recommendTechnique('ordered-list', 11), 'palace');
});

test('builds a handoff route without losing the prepared list', () => {
  const route = buildTechniqueRoute('number-peg', 'Friday spelling', 'spelling', ['rhythm', 'separate']);
  assert.match(route, /^\/number-peg\/build\?/);
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

test('treats an unknown reachability result as online when the device is connected', () => {
  assert.equal(isNetworkStateOnline({ isConnected: true, isInternetReachable: null }), true);
  assert.equal(isNetworkStateOnline({ isConnected: true, isInternetReachable: false }), false);
  assert.equal(isNetworkStateOnline({ isConnected: false, isInternetReachable: true }), false);
});

test('groups waiting reviews into one Home row per memory set', () => {
  const reviews = [
    { id: 'item-2', memorySetId: 'set-1', dueAt: '2026-08-30T10:00:00.000Z' },
    { id: 'item-3', memorySetId: 'set-2', dueAt: '2026-08-29T10:00:00.000Z' },
    { id: 'item-1', memorySetId: 'set-1', dueAt: '2026-08-29T09:00:00.000Z' },
  ];

  const groups = groupMemoryReviews(reviews);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].review.memorySetId, 'set-1');
  assert.equal(groups[0].review.id, 'item-1');
  assert.equal(groups[0].itemCount, 2);
  assert.equal(groups[1].itemCount, 1);
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

test('expands the peg library to 100 anchors with level-based unlocks', () => {
  const pegs = buildAllNumberPegItems();

  assert.equal(pegs.length, 100);
  assert.equal(pegs[0].number, 1);
  assert.equal(pegs[99].number, 100);
  assert.equal(getUnlockedPegCount(0), 10);
  assert.equal(getUnlockedPegCount(3), 30);
  assert.equal(getUnlockedPegCount(99), 100);
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
