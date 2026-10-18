import type { LeaderboardEntry } from '../types/leaderboard.types';

export type LeaderboardPodiumSlot = Readonly<{
  rank: 1 | 2 | 3;
  entry: LeaderboardEntry | null;
}>;

/** Keeps all three medal positions visible and prefers the current player when scores tie. */
export function getLeaderboardPodiumSlots(entries: readonly LeaderboardEntry[]): LeaderboardPodiumSlot[] {
  return ([2, 1, 3] as const).map((rank) => ({
    rank,
    entry: entries.find((entry) => entry.rank === rank && entry.isCurrentUser)
      ?? entries.find((entry) => entry.rank === rank)
      ?? null,
  }));
}
