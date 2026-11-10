export interface ReferralProgramMilestoneConfig {
  key: string;
  title: string;
  referralsRequired: number;
  rewardAiCredits: number;
  rewardPremiumDays: number;
  rewardLabel?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ReferralProgramConfig {
  isEnabled: boolean;
  inviterRewardAiCredits: number;
  inviterRewardPremiumDays: number;
  inviteeRewardAiCredits: number;
  inviteeRewardPremiumDays: number;
  maxSuccessfulReferralsPerUser: number;
  milestones: ReferralProgramMilestoneConfig[];
}

export interface ReferralUser {
  referralId: string;
  refereeUserId: string;
  displayName: string;
  email: string;
  isPremium: boolean;
  redeemedAt: string;
  inviterRewardAiCredits: number;
  inviterRewardPremiumDays: number;
}

export interface ReferralMilestoneProgress {
  rewardXp?: number;
  key: string;
  title: string;
  referralsRequired: number;
  currentReferrals: number;
  rewardAiCredits: number;
  rewardPremiumDays: number;
  rewardLabel?: string | null;
  sortOrder: number;
  isActive: boolean;
  isReached: boolean;
  isAwarded: boolean;
}

export interface ReferralSummary {
  referralCode: string;
  successfulReferrals: number;
  totalAiCreditsEarned: number;
  totalPremiumDaysEarned: number;
  hasRedeemedCode: boolean;
  referredByUserId?: string | null;
  referredByDisplayName?: string | null;
  config: ReferralProgramConfig;
  milestones: ReferralMilestoneProgress[];
  referrals: ReferralUser[];
}

export interface RedeemReferralResult {
  referralId: string;
  referrerUserId: string;
  referrerDisplayName: string;
  inviteeAwardedAiCredits: number;
  inviteeAwardedPremiumDays: number;
  inviterAwardedAiCredits: number;
  inviterAwardedPremiumDays: number;
  newlyAwardedMilestones: ReferralMilestoneProgress[];
}
