import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { LeaderboardEntry } from '../types/leaderboard.types';

export type CommunityLeaderboardEntry = LeaderboardEntry;

export type LeaderboardRewardTier = Readonly<{
  rankFrom: number;
  rankTo: number;
  creditsPerWinner: number;
}>;

export type LeaderboardRewardConfig = Readonly<{
  enabled: boolean;
  weeklyBudget: number;
  minimumActiveDays: number;
  expiryDays: number;
  tiers: readonly LeaderboardRewardTier[];
}>;

export type LeaderboardRewardResult = Readonly<{
  weekStartsAtUtc: string;
  weekEndsAtUtc: string;
  finalRank: number | null;
  finalScore: number;
  activeDays: number;
  credits: number;
  status: 'open' | 'pending' | 'awarded' | 'failed' | 'not-eligible' | 'outside-reward-ranks' | 'no-reward' | string;
  expiresAtUtc: string | null;
  seasonStatus: 'open' | 'settling' | 'settled' | string;
  rewardsEnabled: boolean;
  minimumActiveDays: number;
  qualificationReason: 'qualified' | 'minimum-active-days' | 'opted-out' | 'not-qualified' | 'outside-reward-ranks' | 'rewards-disabled' | 'no-credit-after-tie-split' | string | null;
}>;

export type LeaderboardBoardDefinition = Readonly<{
  id: string;
  kind: 'community-weekly-recall' | 'community-streak' | 'friends-weekly-recall';
  enabled: boolean;
  sortOrder: number;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  tasks?: readonly LeaderboardScoringTask[];
  rewards?: LeaderboardRewardConfig;
}>;

export type LeaderboardScoringTask = Readonly<{
  id: string;
  sortOrder: number;
  metric: 'distinct-recall-items' | 'distinct-due-review-items';
  threshold: number;
  points: number;
  titleEn: string;
  titleZh: string;
}>;

export type LeaderboardTaskProgress = LeaderboardScoringTask & Readonly<{
  currentValue: number;
  isCompleted: boolean;
}>;

export type PublicLeaderboardCatalog = Readonly<{
  boards: readonly LeaderboardBoardDefinition[];
}>;

export type CurrentCommunityLeaderboard = {
  optedIn: boolean;
  weekStartsAtUtc: string;
  weekEndsAtUtc: string;
  eligibleParticipants: number;
  personalGoalScore: number;
  myScore: number | null;
  myRank: number | null;
  entries: readonly CommunityLeaderboardEntry[];
  board: LeaderboardBoardDefinition;
  todayTasks?: readonly LeaderboardTaskProgress[];
  myActiveDays?: number;
  myProjectedRewardCredits?: number | null;
  latestReward?: LeaderboardRewardResult | null;
};

function readData<T>(response: GeneralResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) throw new Error(response.message ?? fallback);
  return response.data;
}

export const communityLeaderboardApi = {
  async getCatalog(): Promise<PublicLeaderboardCatalog> {
    const response = await api.get<GeneralResponse<PublicLeaderboardCatalog>>('/v1/leaderboards/catalog');
    return readData(response.data, 'Could not load leaderboards.');
  },
  async getCurrent(): Promise<CurrentCommunityLeaderboard> {
    const response = await api.get<GeneralResponse<CurrentCommunityLeaderboard>>('/v1/leaderboards/current');
    return readData(response.data, 'Could not load the community leaderboard.');
  },
  async setOptIn(optedIn: boolean): Promise<void> {
    const response = await api.put<GeneralResponse<{ optedIn: boolean; joinedAtUtc: string | null }>>(
      '/v1/leaderboards/preference', { optedIn },
    );
    readData(response.data, 'Could not update your leaderboard preference.');
  },
};
