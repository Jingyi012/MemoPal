import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLeaderboardShareSummary } from '../src/features/leaderboard/utils/leaderboardShareSummary.ts';

const labels = {
  summary: points => `I earned ${points} participation points this week.`,
  rank: rank => `I placed ${rank} on the community leaderboard.`,
  destination: url => `Open the leaderboard in MemoPal: ${url}`,
  privacyNote: 'No name, alias, memory content, questions, answers, or accuracy is shared.',
};

test('leaderboard share includes participation points, optional rank, and privacy boundary only', () => {
  const summary = buildLeaderboardShareSummary(35, 4, 'memopal://community/leaderboard', labels);

  assert.equal(summary, 'I earned 35 participation points this week.\nI placed 4 on the community leaderboard.\nOpen the leaderboard in MemoPal: memopal://community/leaderboard\nNo name, alias, memory content, questions, answers, or accuracy is shared.');
  assert.doesNotMatch(summary, /user id|username|memory title|answer text|accuracy:|score:/i);
});

test('personal-goal sharing omits rank and normalizes unsafe numeric values', () => {
  assert.equal(buildLeaderboardShareSummary(12.9, null, 'memopal://community/leaderboard', labels), 'I earned 12 participation points this week.\nOpen the leaderboard in MemoPal: memopal://community/leaderboard\nNo name, alias, memory content, questions, answers, or accuracy is shared.');
  assert.equal(buildLeaderboardShareSummary(Number.NaN, 0, '', labels), 'I earned 0 participation points this week.\nNo name, alias, memory content, questions, answers, or accuracy is shared.');
});
