import assert from 'node:assert/strict';
import test from 'node:test';
import { getLeaderboardPodiumSlots } from '../src/features/leaderboard/utils/leaderboardPodium.ts';

const entry = (rank, alias, isCurrentUser = false) => ({ rank, alias, score: 0, isCurrentUser });

test('keeps gold, silver and bronze slots visible when the board has fewer than three ranks', () => {
  const slots = getLeaderboardPodiumSlots([entry(1, 'You', true)]);

  assert.deepEqual(slots.map(({ rank, entry: player }) => [rank, player?.alias ?? null]), [
    [2, null], [1, 'You'], [3, null],
  ]);
});

test('prefers the current player for a tied podium rank without inventing another entry', () => {
  const slots = getLeaderboardPodiumSlots([entry(1, 'Learner 1'), entry(1, 'You', true)]);

  assert.equal(slots.length, 3);
  assert.equal(slots[1].entry?.alias, 'You');
  assert.equal(slots.filter(({ entry: player }) => player != null).length, 1);
});
