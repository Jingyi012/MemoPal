import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadAloudPlayer } from '../src/features/education/utils/educationReadAloud.ts';

const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const spoken = [];
  const engine = { maxSpeechInputLength: 100, stop: async () => {}, speak: (text, options) => spoken.push({ text, options }) };
  return { engine, spoken, player: createReadAloudPlayer(async () => engine) };
}
test('explicit playback uses content language and reports actual speech events', async () => {
  const { player, spoken } = fixture();
  const states = [];
  player.play('学校', 'zh-Hans', state => states.push(state));
  await flush();
  assert.equal(spoken[0].options.language, 'zh-CN');
  assert.deepEqual(states, ['loading']);
  spoken[0].options.onStart();
  spoken[0].options.onDone();
  assert.deepEqual(states, ['loading', 'speaking', 'idle']);
});
test('leaving a card while native speech loads prevents late playback', async () => {
  const { engine, spoken } = fixture();
  let resolve;
  const loading = new Promise(done => { resolve = done; });
  const player = createReadAloudPlayer(() => loading);
  const states = [];
  const cancel = player.play('学校', 'zh-Hans', state => states.push(state));
  await flush();
  cancel();
  resolve(engine);
  await flush();
  assert.equal(spoken.length, 0);
  assert.deepEqual(states, ['loading']);
});
test('an old card cancellation and callbacks cannot cancel or update the new reading', async () => {
  const { player, spoken } = fixture();
  const old = [];
  const cancelOld = player.play('学校', 'zh-Hans', state => old.push(state));
  await flush();
  const current = [];
  player.play('门口', 'zh-Hans', state => current.push(state));
  cancelOld();
  await flush();
  spoken[0].options.onDone();
  spoken[1].options.onStart();
  assert.deepEqual(old, ['loading']);
  assert.deepEqual(current, ['loading', 'speaking']);
  assert.equal(spoken[1].text, '门口');
});
test('missing native module and oversize text fail without crashing the course', async () => {
  const states = [];
  createReadAloudPlayer(async () => { throw new Error('Native module missing'); }).play('词', 'zh-Hans', state => states.push(state));
  await flush();
  assert.deepEqual(states, ['loading', 'error']);
  const { player, spoken } = fixture();
  const oversized = [];
  player.play('字'.repeat(101), 'zh-Hans', state => oversized.push(state));
  await flush();
  assert.deepEqual(oversized, ['loading', 'error']);
  assert.equal(spoken.length, 0);
});
