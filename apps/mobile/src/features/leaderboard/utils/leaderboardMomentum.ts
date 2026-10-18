import type { CommunityLeaderboardEntry } from '../api/communityLeaderboard.api';

export type LeaderboardMomentum =
  | Readonly<{ kind: 'leading' }>
  | Readonly<{ kind: 'gap'; pointsToMoveAhead: number }>;

export function getLeaderboardMomentum(
  entries: readonly CommunityLeaderboardEntry[],
  myScore: number | null,
  myRank: number | null,
): LeaderboardMomentum | null {
  if (myScore == null || !Number.isFinite(myScore) || myRank == null || myRank < 1) return null;
  const nextScoreAhead = entries
    .filter(entry => !entry.isCurrentUser && Number.isFinite(entry.score) && entry.score > myScore)
    .reduce<number | null>((closest, entry) => closest == null ? entry.score : Math.min(closest, entry.score), null);

  if (nextScoreAhead == null) return { kind: 'leading' };
  // A tied score does not move a learner ahead, so one point beyond the gap is needed.
  return { kind: 'gap', pointsToMoveAhead: Math.max(1, Math.ceil(nextScoreAhead - myScore) + 1) };
}
