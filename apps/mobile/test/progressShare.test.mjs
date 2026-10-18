import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProgressShareMessage } from '../src/features/gamification/shared/utils/progressShare.ts';

test('progress share message contains only streak and weekly activity aggregates', () => {
  const message = buildProgressShareMessage(4, 3, 8, {
    streak: 'Streak days',
    activeDays: 'Active days this week',
    sessions: 'Practice sessions this week',
    privacyNote: 'No answers or private memory content.',
  });

  assert.equal(message, 'Streak days: 4\nActive days this week: 3\nPractice sessions this week: 8\nNo answers or private memory content.');
  assert.doesNotMatch(message, /accuracy|answer text|memory title|username|score/i);
});

test('progress share normalizes invalid aggregate values', () => {
  assert.equal(buildProgressShareMessage(-1, Number.NaN, 2.9, {
    streak: 'streak', activeDays: 'days', sessions: 'sessions', privacyNote: 'summary only',
  }), 'streak: 0\ndays: 0\nsessions: 2\nsummary only');
});
