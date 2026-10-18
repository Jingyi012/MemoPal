export interface LeaderboardBoardDefinition {
  id: string;
  kind: "community-weekly-recall" | "community-streak" | "friends-weekly-recall";
  enabled: boolean;
  sortOrder: number;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  tasks: LeaderboardScoringTask[];
  rewards: LeaderboardRewardConfig;
}

export interface LeaderboardRewardConfig {
  enabled: boolean;
  weeklyBudget: number;
  minimumActiveDays: number;
  expiryDays: number;
  tiers: LeaderboardRewardTier[];
}

export interface LeaderboardRewardTier {
  rankFrom: number;
  rankTo: number;
  creditsPerWinner: number;
}

export interface LeaderboardScoringTask {
  id: string;
  sortOrder: number;
  metric: "distinct-recall-items" | "distinct-due-review-items";
  threshold: number;
  points: number;
  titleEn: string;
  titleZh: string;
}

export interface LeaderboardCatalogConfig {
  boards: LeaderboardBoardDefinition[];
}
