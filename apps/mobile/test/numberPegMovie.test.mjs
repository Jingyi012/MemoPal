import test from 'node:test';
import assert from 'node:assert/strict';
import { imageJobState } from '../src/features/number-peg/utils/imageJobState.ts';

test('Visualize off never displays a cached image failure or pending job', () => {
  for (const status of ['failed', 'reserved', 'processing']) {
    assert.deepEqual(imageJobState(false, 'image-job', { id: 'image-job', kind: 'number-peg-image', status }),
      { visible: false, pending: false, failed: false });
  }
});
test('only an explicitly requested matching image job displays an image failure', () => {
  assert.equal(imageJobState(true, undefined, undefined).failed, false);
  assert.equal(imageJobState(true, 'text-job', { id: 'text-job', kind: 'number-peg-text', status: 'failed' }).failed, false);
  assert.equal(imageJobState(true, 'image-job', { id: 'image-job', kind: 'number-peg-image', status: 'failed' }).failed, true);
});
import {
  buildInitialSceneCandidates,
  buildSceneCandidates,
  getActionCategory,
  getBoosterPresentation,
  getMovieChoreography,
} from '../src/features/number-peg/utils/numberPegMovie.ts';

const t = (key) => key;
const candle = {
  pegNumber: 1,
  catalogueVersion: 'test-v1',
  keyword: 'candle',
  image: '🕯️',
  description: 'A candle.',
};
const swan = {
  pegNumber: 2,
  catalogueVersion: 'test-v1',
  keyword: 'swan',
  image: '🦢',
  description: 'A swan.',
};

test('number peg candidates cover three distinct interaction categories', () => {
  const candidates = buildSceneCandidates(candle, 'planet', 0, t);
  assert.deepEqual(
    candidates.map((candidate) => candidate.category),
    ['impact', 'transform', 'strange-use']
  );
  assert.equal(new Set(candidates.map((candidate) => candidate.recipe.actionPreset)).size, 3);
  assert.ok(
    candidates.every(
      (candidate) => getActionCategory(candidate.recipe.actionPreset) === candidate.category
    )
  );
});

test('another candidate set changes every action while keeping categories stable', () => {
  const first = buildSceneCandidates(candle, 'planet', 0, t);
  const second = buildSceneCandidates(candle, 'planet', 1, t);
  assert.deepEqual(
    second.map((candidate) => candidate.category),
    first.map((candidate) => candidate.category)
  );
  assert.equal(
    first.some(
      (candidate, index) => candidate.recipe.actionPreset === second[index].recipe.actionPreset
    ),
    false
  );
});

test('recipe motion maps action families to visibly different fallback motions', () => {
  assert.equal(getMovieChoreography('crash').category, 'impact');
  assert.equal(getMovieChoreography('melt').category, 'transform');
  assert.equal(getMovieChoreography('launch').category, 'strange-use');
  assert.notEqual(
    getMovieChoreography('crash').targetToScale,
    getMovieChoreography('melt').targetToScale
  );
});

test('initial scenes preserve each item own peg instead of resetting to peg one', () => {
  const scenes = buildInitialSceneCandidates(['planet', 'milk'], [candle, swan], 2, t);
  assert.equal(scenes[0].recipe.anchorSnapshot?.pegNumber, 1);
  assert.equal(scenes[1].recipe.anchorSnapshot?.pegNumber, 2);
  assert.match(scenes[1].sceneText, /swan/i);
});

test('a sensory booster changes visible and feedback playback properties', () => {
  const plain = getBoosterPresentation();
  const loud = getBoosterPresentation('loud');
  assert.notEqual(loud.emoji, plain.emoji);
  assert.notEqual(loud.tint, plain.tint);
});
