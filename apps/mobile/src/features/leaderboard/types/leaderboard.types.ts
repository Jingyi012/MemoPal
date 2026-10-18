/** Shared ranking row shape used by every leaderboard type. */
export type LeaderboardEntry = Readonly<{
  rank: number;
  alias: string;
  score: number;
  isCurrentUser: boolean;
}>;
