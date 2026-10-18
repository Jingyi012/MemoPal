import assert from 'node:assert/strict';
import test from 'node:test';
import { interpolateTranslation, translations } from '../src/core/i18n/i18n.ts';

test('leaderboard center and challenge copy is translated in English and Chinese', () => {
  const keys = [
    'communityLeaderboardShortcutTitle',
    'communityLeaderboardShortcutBody',
    'leaderboardTitle',
    'leaderboardDescription',
    'leaderboardDetailTitle',
    'leaderboardCenterCommunityTitle',
    'leaderboardCenterCommunityDescription',
    'leaderboardCenterRankPendingHint',
    'leaderboardCenterPrivateHint',
    'leaderboardJoinBody',
    'leaderboardCenterDetails',
    'leaderboardMoreBoards',
    'leaderboardComingSoon',
    'leaderboardStreakBoard',
    'leaderboardFriendsBoard',
    'leaderboardPreviewTitle',
    'leaderboardPreviewSubtitle',
    'leaderboardPreviewBadge',
    'leaderboardPodiumOpenSlot',
    'leaderboardScoreHelp',
    'leaderboardCloseScoreHelp',
    'leaderboardJoinedStandingsTitle',
    'leaderboardJoinedStandingsSubtitle',
    'leaderboardSoloRankHint',
    'leaderboardSoloRankBadge',
    'leaderboardJoinedStandingsNote',
    'leaderboardPreviewRank',
    'leaderboardPreviewPlayer',
    'leaderboardPreviewPoints',
    'leaderboardPreviewYou',
    'leaderboardPreviewJoinHint',
    'leaderboardPreviewJoinedHint',
    'leaderboardPreviewDisclaimer',
  ];

  for (const locale of [translations.en, translations.zh]) {
    for (const key of keys) {
      assert.ok(locale.library[key], `${key} is translated`);
      assert.notEqual(locale.library[key], key, `${key} does not fall back to its key`);
    }
    assert.ok(locale.home.leaderboardProgressTitle, 'leaderboardProgressTitle is translated');
    assert.notEqual(locale.home.leaderboardProgressTitle, 'leaderboardProgressTitle');
  }
});

test('interpolates double-braced localized values without leaving braces behind', () => {
  assert.equal(interpolateTranslation('{{count}} / {{target}} opted in', { count: 3, target: 10 }), '3 / 10 opted in');
});

test('continues to interpolate single-braced values', () => {
  assert.equal(interpolateTranslation('{count} points', { count: 15 }), '15 points');
});

test('keeps unknown placeholders intact', () => {
  assert.equal(interpolateTranslation('{{count}} / {{target}}', { count: 3 }), '3 / {{target}}');
});
