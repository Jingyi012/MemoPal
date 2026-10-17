import assert from 'node:assert/strict';
import test from 'node:test';
import { getNumberPegStoryHint, maskNumberPegAnswer } from '../src/features/number-peg/utils/numberPegHints.ts';
import { reinforceRecallQueue, restoreRecallQueue, getSavedReviewItemIds } from '../src/features/practice-attempts/utils/recallRound.ts';
import { isReviewOverdue } from '../src/features/practice-attempts/utils/reviewDate.ts';
import { selectReviewSessionItems, getReviewTiming } from '../src/features/practice-attempts/utils/reviewSession.ts';

test('review subsets use server eligibility and preserve original peg positions', () => {
  const items = [{ id: 'a', position: 1 }, { id: 'b', position: 4 }, { id: 'c', position: 7 }];
  const progress = [{ memoryItemId: 'a', dueAt: '2099-01-01', isDue: true },
    { memoryItemId: 'b', dueAt: '2000-01-01', isDue: false },
    { memoryItemId: 'c', dueAt: null, isDue: false }];
  assert.deepEqual(selectReviewSessionItems(items, progress, 'due'), [items[0]]);
  assert.deepEqual(selectReviewSessionItems(items, progress, 'learn'), [items[2]]);
  assert.deepEqual(selectReviewSessionItems(items, progress, 'browse'), items);
  assert.deepEqual(selectReviewSessionItems(items, [], 'due'), []);
});

test('resuming a subset retains its reinforcement queue without adding other items', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const saved = ['a', 'c', 'a'];
  const ids = getSavedReviewItemIds(items, saved, 2);
  assert.deepEqual([...ids], ['a', 'c']);
  assert.deepEqual(restoreRecallQueue(items.filter(item => ids.has(item.id)), saved), saved);
  for (const [queue, index] of [[[], 0], [saved, 3], [saved, -1], [['deleted'], 0], [['a','a','a','a'], 0]]) {
    assert.equal(getSavedReviewItemIds(items, queue, index), null);
  }
});

test('review labels distinguish scheduled dates, due items and initial learning', () => {
  const now = new Date(2026, 8, 16, 10);
  assert.equal(getReviewTiming(null, false, now).key, 'newItem');
  assert.equal(getReviewTiming(new Date(2026,8,16,9).toISOString(), true, now).key, 'dueNow');
  assert.deepEqual(getReviewTiming(new Date(2026,8,15,9).toISOString(), true, now), { key: 'overdueDays', count: 1 });
  assert.equal(getReviewTiming(new Date(2026,8,16,14).toISOString(), false, now).key, 'laterToday');
  assert.equal(getReviewTiming(new Date(2026,8,17,8).toISOString(), false, now).key, 'tomorrow');
  assert.deepEqual(getReviewTiming(new Date(2026,8,19,8).toISOString(), false, now), { key: 'inDays', count: 3 });
  assert.equal(getReviewTiming('invalid', false, now).key, 'unavailable');
});
import { createNumberPegRecallOrder } from '../src/features/number-peg/utils/numberPegRecall.ts';

test('number recall shuffles item identities and keeps ordered lists sequential', () => {
  const items = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
  const shuffled = createNumberPegRecallOrder(items, false, () => 0);
  assert.deepEqual(shuffled, ['two', 'three', 'one']);
  assert.deepEqual(createNumberPegRecallOrder(items, true, () => 0), ['one', 'two', 'three']);
  assert.deepEqual(restoreRecallQueue(items, shuffled), shuffled);
  assert.deepEqual(restoreRecallQueue(items, ['one', 'one', 'three']), ['one', 'two', 'three']);
  assert.deepEqual(restoreRecallQueue(items, ['one', 'two', 'deleted']), ['one', 'two', 'three']);
});

test('later retries cannot reduce previously used hints or inflate actual attempts', () => {
  const hinted = [{ memoryItemId: 'one', isCorrect: false, attemptCount: 0, responseMs: 0, hintCount: 3 }];
  const answered = upsertRecallResponse(hinted, 'one', true, 500, 1);
  assert.equal(answered[0].hintCount, 3);
  assert.equal(answered[0].attemptCount, 1);
});
import {
  getSpellingHint,
  isRecallAnswerCorrect,
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
  applyNumberPegDefinitions,
  getUnlockedPegCount,
  getPegUnlockLevel,
} from '../src/features/number-peg/utils/numberPegMap.ts';
import {
  choosePalaceScene,
  getAvailablePalaceScenes,
  getPalaceCapacityMessage,
  getPalaceCapacityShortfall,
  getLargestPalaceCapacity,
  getPalaceLoci,
  sceneFitsPalaceItems,
} from '../src/features/palace-scenes/utils/palaceCapacity.ts';
import { getLevelTitleForLevel } from '../src/features/gamification/shared/utils/levelTitles.ts';
import { groupMemoryReviews } from '../src/features/practice-attempts/utils/reviewGrouping.ts';
import {
  createPalaceAssociation,
  ensurePalaceAssociations,
  getAssociationText,
} from '../src/features/palace-scenes/utils/palaceAuthoring.ts';
import { getNetworkUiState, isNetworkStateOnline } from '../src/core/network/networkState.ts';
import {
  getPalaceLocusDescription,
  getPalaceLocusName,
} from '../src/features/palace-scenes/utils/palaceLocalization.ts';

const makeScene = (id, locusCount) => ({
  id,
  name: id,
  description: '',
  imageUrl: '',
  status: 'published',
  isTemplate: true,
  isPremium: false,
  unlockLevel: 1,
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

test('accepts safe recall variations without accepting short-word guesses', () => {
  assert.equal(isRecallAnswerCorrect('New York', 'new-york'), true);
  assert.equal(isRecallAnswerCorrect('café', 'CAFE'), true);
  assert.equal(isRecallAnswerCorrect('separate', 'seperate'), true);
  assert.equal(isRecallAnswerCorrect('apple', 'appl'), true);
  assert.equal(isRecallAnswerCorrect('cat', 'car'), false);
  assert.equal(isRecallAnswerCorrect('apple', 'orange'), false);
  assert.equal(isRecallAnswerCorrect('C++', 'C'), false);
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

test('number peg hints use the actual story and hide every occurrence of the answer', () => {
  assert.equal(getNumberPegStoryHint('A swan juggles APPLES, then balances apples on its head.', 'apples'),
    'A swan juggles ___, then balances ___ on its head.');
  assert.equal(getNumberPegStoryHint('A candle melts a passport at the airport.', 'passport'),
    'A candle melts a ___ at the airport.');
  assert.equal(getNumberPegStoryHint('天鹅把苹果抛到天空，又接住了苹果。', '苹果'),
    '天鹅把___抛到天空,又接住了___。');
});

test('number peg hints mask multiword answers, Unicode variants and regex punctuation literally', () => {
  assert.equal(maskNumberPegAnswer('New\nYork floats above a NEW sign and a York balloon.', 'New York'),
    '___ floats above a ___ sign and a ___ balloon.');
  assert.equal(maskNumberPegAnswer('A candle writes C++ beside C++.', 'C++'), 'A candle writes ___ beside ___.');
  assert.equal(maskNumberPegAnswer('A swan carries ＡＰＰＬＥＳ.', 'apples'), 'A swan carries ___.');
  assert.equal(maskNumberPegAnswer('A swan drinks cafe\u0301.', 'café'), 'A swan drinks ___.');
});

test('number peg hints report missing or answer-only stories instead of a generic instruction', () => {
  assert.equal(getNumberPegStoryHint('', 'apple'), null);
  assert.equal(getNumberPegStoryHint('apple APPLE!', 'apple'), null);
  assert.equal(getNumberPegStoryHint('A story without a valid answer', '  '), null);
});

test('reinforces a missed item after two other questions and preserves the first miss', () => {
  const order = ['one', 'two', 'three', 'four'];
  const first = upsertRecallResponse([], 'one', false, 300);
  const queue = reinforceRecallQueue(order, 0, first[0], false);
  assert.deepEqual(queue, ['one', 'two', 'three', 'one', 'four']);
  assert.deepEqual(order, ['one', 'two', 'three', 'four']);
  const retry = upsertRecallResponse(first, 'one', true, 200);
  assert.equal(retry[0].attemptCount, 2);
  assert.deepEqual(reinforceRecallQueue(queue, 3, retry[0], false), queue);
  assert.equal(retry.filter((r) => r.isCorrect && r.attemptCount === 1 && !r.hintCount).length, 0);
});

test('hinted successes return once with hidden hints while keeping their assisted history', () => {
  const first = upsertRecallResponse([], 'one', true, 300, 2);
  const queue = reinforceRecallQueue(['one', 'two'], 0, first[0], true);
  assert.deepEqual(queue, ['one', 'two', 'one']);
  const retry = upsertRecallResponse(first, 'one', true, 200, 0);
  assert.equal(retry[0].hintCount, 2);
  assert.equal(retry[0].attemptCount, 2);
  assert.deepEqual(reinforceRecallQueue(queue, 2, retry[0], false), queue);
});

test('even an entirely forgotten round ends after one gentle revisit per item', () => {
  let queue = ['one', 'two', 'three'];
  let responses = [];
  for (let index = 0; index < queue.length; index += 1) {
    assert.ok(index < 6, 'the round must not loop indefinitely');
    responses = upsertRecallResponse(responses, queue[index], false, 100);
    queue = reinforceRecallQueue(queue, index, responses.find((r) => r.memoryItemId === queue[index]), false);
  }
  assert.equal(queue.length, 6);
  assert.equal(responses.length, 3);
  assert.ok(responses.every((r) => r.attemptCount === 2 && !r.isCorrect));
});

test('a single-item round can finish even when every recall fails', () => {
  const response = { memoryItemId: 'one', isCorrect: false, attemptCount: 2, responseMs: 100 };
  assert.deepEqual(reinforceRecallQueue(['one', 'one'], 1, response, false), ['one', 'one']);
});

test('resuming retains the exact reinforcement queue and rejects missing or over-repeated items', () => {
  const items = [{ id: 'one' }, { id: 'two' }];
  const saved = JSON.parse(JSON.stringify(['two', 'one', 'two', 'one']));
  assert.deepEqual(restoreRecallQueue(items, saved), saved);
  assert.deepEqual(restoreRecallQueue(items, ['one', 'one']), ['one', 'two']);
  assert.deepEqual(restoreRecallQueue(items, ['one', 'two', 'deleted']), ['one', 'two']);
  assert.deepEqual(restoreRecallQueue(items, ['one', 'two', 'one', 'one', 'one']), ['one', 'two']);
  assert.deepEqual(restoreRecallQueue(items, {}), ['one', 'two']);
});

test('day-based reviews only become overdue on the next local date', () => {
  const now = new Date(2026, 8, 16, 15);
  const earlierToday = new Date(2026, 8, 16, 8).toISOString();
  const review = { dueAt: earlierToday, intervalDays: 1, lastResultCorrect: true };
  assert.equal(isReviewOverdue(review, now), false);
  assert.equal(isReviewOverdue({ ...review, dueAt: new Date(2026, 8, 15, 23, 59).toISOString() }, now), true);
  assert.equal(isReviewOverdue({ ...review, intervalDays: 0 }, now), false, 'assisted success is also a day-based review');
  assert.equal(isReviewOverdue({ ...review, intervalDays: 0, lastResultCorrect: false }, now), true);
  assert.equal(isReviewOverdue({ ...review, dueAt: new Date(2026, 8, 16, 16).toISOString(), intervalDays: 0, lastResultCorrect: false }, now), false);
});

test('continues imported drafts through either technique without losing their identity or collection', () => {
  for (const technique of ['number-peg', 'palace']) {
    const route = buildTechniqueRoute(technique, 'Edited title', 'ordered-list', ['China', 'Japan'], undefined, 'global', 'folder-1',
      { memorySetId: 'draft-1', expectedVersion: '3', description: 'A & B' });
    const url = new URL(route, 'https://example.test');
    assert.equal(url.pathname, technique === 'palace' ? '/palaces/build' : '/number-peg/build');
    assert.equal(url.searchParams.get('memorySetId'), 'draft-1');
    assert.equal(url.searchParams.get('expectedVersion'), '3');
    assert.equal(url.searchParams.get('memoryFolderId'), 'folder-1');
    assert.equal(url.searchParams.get('description'), 'A & B');
    assert.deepEqual(JSON.parse(url.searchParams.get('items')), ['China', 'Japan']);
  }
});

test('preserves hint usage without treating it as another answer attempt', () => {
  const hinted = [{ memoryItemId: 'item-1', isCorrect: false, attemptCount: 0, responseMs: 0, hintCount: 2 }];
  const answered = upsertRecallResponse(hinted, 'item-1', true, 180, 2);

  assert.equal(answered.length, 1);
  assert.equal(answered[0].attemptCount, 1);
  assert.equal(answered[0].hintCount, 2);
});

test('uses localized Palace locus copy and keeps custom copy as fallback', () => {
  const locus = {
    name: 'Desk lamp',
    nameEn: 'Desk lamp',
    nameZh: '台灯',
    description: 'A desk lamp.',
    descriptionEn: 'A clear stop at the desk lamp.',
    descriptionZh: '台灯是一个清晰的记忆停靠点。',
  };

  assert.equal(getPalaceLocusName(locus, 'en'), 'Desk lamp');
  assert.equal(getPalaceLocusName(locus, 'zh'), '台灯');
  assert.equal(getPalaceLocusDescription(locus, 'zh', 'fallback'), '台灯是一个清晰的记忆停靠点。');
  assert.equal(getPalaceLocusName({ name: 'My sofa' }, 'zh'), 'My sofa');
  assert.equal(getPalaceLocusDescription({ name: 'My sofa' }, 'en', 'fallback'), 'fallback');
});

test('builds a Palace handoff with its scene and composer origin', () => {
  const route = buildTechniqueRoute('palace', 'Biology chapter', 'facts', ['cells'], 'scene-42', 'global');
  assert.match(route, /^\/palaces\/build\?/);
  assert.match(route, /sceneId=scene-42/);
  assert.match(route, /origin=global/);
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

test('uses admin unlock levels while preserving number order', () => {
  const definitions = buildAllNumberPegItems().map((peg) => ({
    number: peg.number,
    name: peg.keyword,
    icon: peg.image,
    description: peg.description,
    unlockLevel: Math.ceil(peg.number / 10),
  }));
  for (const definition of definitions) {
    if (definition.number >= 11 && definition.number <= 40) definition.unlockLevel = 4;
  }
  applyNumberPegDefinitions({ pegs: definitions });

  assert.equal(getPegUnlockLevel(11), 4);
  assert.equal(getPegUnlockLevel(12), 4);
  assert.equal(getUnlockedPegCount(3), 10);
  assert.equal(getUnlockedPegCount(4), 40);
});

test('chooses the smallest Palace that fits and explains overflow clearly', () => {
  const compact = makeScene('compact', 6);
  const roomy = makeScene('roomy', 12);
  const scenes = [roomy, compact];

  assert.equal(choosePalaceScene(scenes, 5).id, 'compact');
  assert.equal(choosePalaceScene(scenes, 8).id, 'roomy');
  assert.equal(choosePalaceScene(scenes, 20), undefined);
  assert.equal(getLargestPalaceCapacity(scenes), 12);
  assert.equal(choosePalaceScene(scenes, 5, 'roomy').id, 'roomy');
  assert.equal(sceneFitsPalaceItems(compact, 7), false);
  assert.equal(getPalaceCapacityShortfall(15, 12), 3);
  assert.deepEqual(getAvailablePalaceScenes([compact, { ...roomy, isPremium: true }], false).map((scene) => scene.id), ['compact']);
  const levelTwoRoom = { ...roomy, id: 'level-two-room', unlockLevel: 2 };
  assert.deepEqual(getAvailablePalaceScenes([compact, levelTwoRoom], false, 1).map((scene) => scene.id), ['compact']);
  assert.deepEqual(getAvailablePalaceScenes([compact, levelTwoRoom], false, 2).map((scene) => scene.id), ['compact', 'level-two-room']);
  assert.equal(getPalaceLoci(roomy).length, 12);
  assert.equal(
    getPalaceCapacityMessage(15, 12),
    'This list has 15 items, but the largest available Palace has 12 loci. Remove 3 items or create a second memory.',
  );
});

test('shows one global offline state and reserves local request errors for online failures', () => {
  assert.deepEqual(getNetworkUiState(null), {
    isReady: false,
    isOnline: false,
    isOffline: false,
    canShowRequestErrors: false,
  });
  assert.deepEqual(getNetworkUiState({ isConnected: false, isInternetReachable: false }), {
    isReady: true,
    isOnline: false,
    isOffline: true,
    canShowRequestErrors: false,
  });
  assert.deepEqual(getNetworkUiState({ isConnected: true, isInternetReachable: true }), {
    isReady: true,
    isOnline: true,
    isOffline: false,
    canShowRequestErrors: true,
  });
});

test('resolves configurable level titles from the nearest configured level', () => {
  const titles = [
    { level: 1, titleEn: 'Starter', titleZh: '起步者' },
    { level: 4, titleEn: 'Recall Ranger', titleZh: '回忆游侠' },
    { level: 9, titleEn: 'Mind Pilot', titleZh: '思维飞行员' },
  ];

  assert.equal(getLevelTitleForLevel(1, titles).titleEn, 'Starter');
  assert.equal(getLevelTitleForLevel(7, titles).titleZh, '回忆游侠');
  assert.equal(getLevelTitleForLevel(12, titles).titleEn, 'Mind Pilot');
});
