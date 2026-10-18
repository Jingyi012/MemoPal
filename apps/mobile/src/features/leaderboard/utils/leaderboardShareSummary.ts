export type LeaderboardShareLabels = Readonly<{
  summary: (points: number) => string;
  rank: (rank: number) => string;
  destination: (url: string) => string;
  privacyNote: string;
}>;

export function buildLeaderboardShareSummary(
  points: number,
  rank: number | null,
  leaderboardUrl: string,
  labels: LeaderboardShareLabels,
): string {
  const safePoints = Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0;
  const lines = [labels.summary(safePoints)];
  if (rank != null && Number.isFinite(rank) && rank > 0) lines.push(labels.rank(Math.floor(rank)));
  if (leaderboardUrl.trim()) lines.push(labels.destination(leaderboardUrl));
  lines.push(labels.privacyNote);
  return lines.join('\n');
}
