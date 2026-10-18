export type EducationAssignmentLeaderboard = Readonly<{
  assignmentId: string;
  title: string;
  resultsPublishedAt: string;
  assignedParticipantCount: number;
  rankedParticipantCount: number;
  myRank: number | null;
  myScore: number | null;
  maxScore: number | null;
  fullLeaderboardEnabled: boolean;
  visibleEntries: readonly Readonly<{ rank: number; alias: string; score: number; maxScore: number; isMe: boolean }> [];
}>;
