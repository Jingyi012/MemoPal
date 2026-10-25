import assert from 'node:assert/strict';
import test from 'node:test';
import { actionForTrigger } from '../src/features/profile/companion/behavior.ts';
import { getCompanionStage, companionArtboard } from '../src/features/profile/companion/growth.ts';
import { INITIAL_PEARL_QUEST, pearlQuestReducer as pearl, shuffledPearls } from '../src/features/profile/companion/pearlQuest.ts';
import { chooseIdleBehavior, choosePetReaction, isTapEasterEgg, nextIdleDelay, timeOfDay } from '../src/features/profile/companion/playBehavior.ts';
import { INITIAL_BUBBLE_GAME, bubbleGameReducer, createBubbleTarget, INITIAL_CORAL_GAME, coralGameReducer, createCoralPattern } from '../src/features/profile/companion/playGames.ts';
import { sampleSwimCurve, swimAtlasFrameAtPhase } from '../src/features/profile/companion/swimAnimation.ts';

test('swim atlas loops through the complete periodic swim cycle', () => {
  assert.equal(swimAtlasFrameAtPhase(0), 0);
  assert.equal(swimAtlasFrameAtPhase(.5), 32);
  assert.equal(swimAtlasFrameAtPhase(.999), 63);
  assert.equal(swimAtlasFrameAtPhase(1), 0);
  assert.equal(swimAtlasFrameAtPhase(.999, 16), 15);
  assert.equal(swimAtlasFrameAtPhase(.8, 1), 0);
});

test('swim paths follow a smooth curve and retain the requested endpoints', () => {
  const points = sampleSwimCurve({ x: -20, y: 5 }, { x: 40, y: 25 }, 18, 8);
  assert.equal(points.length, 9);
  assert.deepEqual(points[0], { x: -20, y: 5 });
  assert.deepEqual(points.at(-1), { x: 40, y: 25 });
  assert.notEqual(points[4].y, 15);
  assert.ok(points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
});

test('swim path samples stay inside the tank bounds', () => {
  const points = sampleSwimCurve({ x: 80, y: 0 }, { x: -80, y: 0 }, 90, 24, { x: 80, y: 42 });
  assert.deepEqual(points[0], { x: 80, y: 0 });
  assert.deepEqual(points.at(-1), { x: -80, y: 0 });
  assert.ok(points.every(point => Math.abs(point.x) <= 80 && Math.abs(point.y) <= 42));
});

test('bubble game counts only popped bubbles and ends after 45 seconds', () => {
  let game = bubbleGameReducer(INITIAL_BUBBLE_GAME, { type: 'start' });
  for (let i = 0; i < 3; i += 1) game = bubbleGameReducer(game, { type: 'countdown' });
  assert.equal(game.phase, 'playing');
  game = bubbleGameReducer(game, { type: 'spawn', target: { id: 1, x: .5, kind: 'bubble', size: 52 } });
  game = bubbleGameReducer(game, { type: 'pop', id: 1 });
  assert.equal(game.score, 1);
  assert.equal(bubbleGameReducer(game, { type: 'pop', id: 1 }), game);
  game = bubbleGameReducer(game, { type: 'spawn', target: { id: 2, x: .5, kind: 'urchin', size: 52 } });
  game = bubbleGameReducer(game, { type: 'pop', id: 2 });
  assert.equal(game.score, 1);
  assert.equal(game.streak, 0);
  for (let i = 0; i < 45; i += 1) game = bubbleGameReducer(game, { type: 'tick' });
  assert.equal(game.phase, 'done');
  assert.equal(game.seconds, 0);
  assert.equal(bubbleGameReducer(game, { type: 'spawn', target: { id: 3, x: .5, kind: 'bubble', size: 52 } }), game);
});

test('bubble game allows a sixty second screen-reader round without changing normal rounds', () => {
  let accessible = bubbleGameReducer(INITIAL_BUBBLE_GAME, { type: 'start', seconds: 60 });
  assert.equal(accessible.seconds, 60);
  for (let i = 0; i < 3; i += 1) accessible = bubbleGameReducer(accessible, { type: 'countdown' });
  for (let i = 0; i < 59; i += 1) accessible = bubbleGameReducer(accessible, { type: 'tick' });
  assert.equal(accessible.phase, 'playing');
  assert.equal(bubbleGameReducer(accessible, { type: 'tick' }).phase, 'done');
  assert.equal(bubbleGameReducer(INITIAL_BUBBLE_GAME, { type: 'start' }).seconds, 45);
});

test('bubble game reuses a free static slot without overlapping a surviving target', () => {
  let game = bubbleGameReducer(INITIAL_BUBBLE_GAME, { type: 'start' });
  for (let i = 0; i < 3; i += 1) game = bubbleGameReducer(game, { type: 'countdown' });
  for (let id = 1; id <= 8; id += 1) game = bubbleGameReducer(game, {
    type: 'spawn', target: { id, x: .5, kind: 'bubble', size: 52 },
  });
  assert.deepEqual(game.targets.map(target => target.slot), [0, 1, 2, 3, 4, 5, 6, 7]);
  game = bubbleGameReducer(game, { type: 'pop', id: 3 });
  game = bubbleGameReducer(game, { type: 'spawn', target: { id: 9, x: .5, kind: 'bubble', size: 52 } });
  assert.equal(game.targets.find(target => target.id === 9)?.slot, 2);
  assert.equal(new Set(game.targets.map(target => target.slot)).size, 8);
});

test('spawn positions and rare urchins are deterministic and bounded', () => {
  const sequence = [0, .01, .99]; let cursor = 0;
  const target = createBubbleTarget(7, () => sequence[cursor++]);
  assert.deepEqual(target, { id: 7, x: .05, kind: 'urchin', size: 67 });
  assert.deepEqual(createCoralPattern(3, () => .99), [3, 3, 3]);
});

test('coral duet replays a missed pattern and finishes four rounds without penalties', () => {
  let game = coralGameReducer(INITIAL_CORAL_GAME, { type: 'start' });
  game = coralGameReducer(game, { type: 'countdown' });
  game = coralGameReducer(game, { type: 'countdown' });
  game = coralGameReducer(game, { type: 'countdown', pattern: [1, 2] });
  assert.equal(game.phase, 'showing');
  assert.equal(coralGameReducer(game, { type: 'pick', index: 1 }), game);
  game = coralGameReducer(game, { type: 'shown' });
  game = coralGameReducer(game, { type: 'pick', index: 0 });
  assert.equal(game.phase, 'showing');
  assert.equal(game.score, 0);
  for (const pattern of [[1, 2], [0, 1, 2], [3, 2, 1, 0], [0, 1, 2, 3, 0]]) {
    game = coralGameReducer(game, { type: 'shown' });
    for (const index of pattern) game = coralGameReducer(game, { type: 'pick', index });
    if (game.phase !== 'done') game = coralGameReducer(game, { type: 'next', pattern: [[0, 1, 2], [3, 2, 1, 0], [0, 1, 2, 3, 0]][game.round - 1] });
  }
  assert.equal(game.phase, 'done');
  assert.ok(game.score > 0);
  assert.equal(coralGameReducer(game, { type: 'pick', index: 0 }), game);
});

test('pet and idle choices are deterministic, bounded, and avoid immediate repeats', () => {
  assert.equal(choosePetReaction(null, () => 0), 'rare');
  assert.notEqual(choosePetReaction('rare', () => 0), 'rare');
  assert.notEqual(choosePetReaction('hop', () => .3), 'hop');
  assert.notEqual(chooseIdleBehavior('chase', () => 0), 'chase');
  assert.equal(chooseIdleBehavior('chase', () => 0, true), 'yawn');
  assert.notEqual(chooseIdleBehavior('yawn', () => 0, true), 'yawn');
  assert.equal(nextIdleDelay(() => 0), 6000);
  assert.equal(nextIdleDelay(() => 1), 14999.991);
  assert.equal(nextIdleDelay(() => 0, true), 7200);
});

test('five quick taps trigger an egg but slower or fewer taps do not', () => {
  assert.equal(isTapEasterEgg([0, 300, 600, 900, 1200], 1200), true);
  assert.equal(isTapEasterEgg([0, 300, 600, 900], 900), false);
  assert.equal(isTapEasterEgg([0, 300, 900, 1200, 1500], 1500), false);
  assert.equal(isTapEasterEgg([0, 500, 1000, 1500, 2400], 2400), false);
});

test('device hours select day, dusk and night without persistence', () => {
  assert.equal(timeOfDay(12), 'day');
  assert.equal(timeOfDay(18), 'dusk');
  assert.equal(timeOfDay(23), 'night');
  assert.equal(timeOfDay(3), 'night');
});

test('pearl quest matches pairs, tracks a streak, and ends after all four treasures', () => {
  let game = pearl(INITIAL_PEARL_QUEST, { type: 'start', cards: [0, 1, 2, 3, 0, 1, 2, 3] });
  game = pearl(game, { type: 'flip', index: 0 });
  game = pearl(game, { type: 'flip', index: 4 });
  assert.deepEqual(game.matched, [0, 4]);
  assert.equal(game.combo, 1);
  game = pearl(pearl(game, { type: 'flip', index: 1 }), { type: 'flip', index: 5 });
  assert.equal(game.bestCombo, 2);
  game = pearl(pearl(game, { type: 'flip', index: 2 }), { type: 'flip', index: 6 });
  game = pearl(pearl(game, { type: 'flip', index: 3 }), { type: 'flip', index: 7 });
  assert.equal(game.phase, 'solved');
  assert.equal(game.attempts, 4);
  assert.equal(pearl(game, { type: 'flip', index: 0 }), game);
});

test('pearl quest gives a one-use hint and hides mismatches before another flip', () => {
  let game = pearl(INITIAL_PEARL_QUEST, { type: 'start', cards: [0, 1, 2, 3, 0, 1, 2, 3] });
  game = pearl(game, { type: 'hint' });
  assert.deepEqual(game.open, [0]);
  assert.equal(game.hintsLeft, 0);
  game = pearl(game, { type: 'flip', index: 1 });
  assert.deepEqual(game.open, [0, 1]);
  assert.equal(pearl(game, { type: 'flip', index: 4 }), game);
  game = pearl(game, { type: 'hide' });
  assert.deepEqual(game.open, []);
  assert.equal(game.combo, 0);
  assert.equal(game.attempts, 1);
  assert.equal(pearl(game, { type: 'hint' }), game);
});

test('pearl layouts contain exactly four pairs and invalid layouts do not start', () => {
  const cards = shuffledPearls(() => .43);
  assert.deepEqual(cards.slice().sort(), [0, 0, 1, 1, 2, 2, 3, 3]);
  assert.equal(pearl(INITIAL_PEARL_QUEST, { type: 'start', cards: [0, 0, 1, 1, 2, 2, 3, 9] }), INITIAL_PEARL_QUEST);
});

test('pearl quest ends gently after 45 active seconds and pauses outside play', () => {
  let game = pearl(INITIAL_PEARL_QUEST, { type: 'start', cards: shuffledPearls(() => .43) });
  assert.equal(game.seconds, 45);
  assert.equal(pearl(INITIAL_PEARL_QUEST, { type: 'tick' }), INITIAL_PEARL_QUEST);
  for (let second = 0; second < 44; second += 1) game = pearl(game, { type: 'tick' });
  assert.equal(game.phase, 'playing');
  assert.equal(game.seconds, 1);
  game = pearl(game, { type: 'tick' });
  assert.equal(game.phase, 'timeUp');
  assert.equal(game.seconds, 0);
  assert.equal(pearl(game, { type: 'tick' }), game);
});

test('Momo starts at level one and growth stops at the moonlit form without resetting', () => {
  assert.equal(getCompanionStage(1).level, 1);
  assert.equal(getCompanionStage(2).level, 2);
  assert.equal(companionArtboard(2), 'Momo 02');
  assert.equal(getCompanionStage(10).level, 10);
  assert.equal(getCompanionStage(100).level, 10);
  assert.equal(companionArtboard(100), 'Momo 10');
});

test('missing or malformed levels cannot unlock a growth stage', () => {
  for (const level of [NaN, Infinity, -Infinity, -1, 0]) assert.equal(getCompanionStage(level).level, 1);
  assert.equal(getCompanionStage(1.99).level, 1);
  assert.equal(getCompanionStage(2.01).level, 2);
});

test('learning and relationship milestones celebrate while return welcomes', () => {
  assert.equal(actionForTrigger('practice'), 'celebrate');
  assert.equal(actionForTrigger('bond'), 'celebrate');
  assert.equal(actionForTrigger('return'), 'hello');
  assert.equal(actionForTrigger('outfit'), 'dance');
});
