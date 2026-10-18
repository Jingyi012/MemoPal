import test from 'node:test';
import assert from 'node:assert/strict';
import { getLeaderboardMomentum } from '../src/features/leaderboard/utils/leaderboardMomentum.ts';

const row = (rank, score, isCurrentUser = false) => ({ rank, score, isCurrentUser, alias: isCurrentUser ? 'You' : `Learner ${rank}` });

test('calculates the points needed to move ahead of the nearest higher score', () => {
  assert.deepEqual(getLeaderboardMomentum([row(7, 36), row(8, 30, true), row(9, 28)], 30, 8), {
    kind: 'gap', pointsToMoveAhead: 7,
  });
});

test('reports leading when no higher score is visible and hides momentum without a ranked score', () => {
  assert.deepEqual(getLeaderboardMomentum([row(1, 40, true), row(2, 38)], 40, 1), { kind: 'leading' });
  assert.equal(getLeaderboardMomentum([row(1, 40, true)], null, null), null);
  assert.equal(getLeaderboardMomentum([], 0, null), null);
});
