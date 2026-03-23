export interface ReferralProgramMilestoneConfig {
  key: string;
  title: string;
  referralsRequired: number;
  rewardXp: number;
  rewardPremiumDays: number;
  rewardLabel?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ReferralProgramConfig {
  isEnabled: boolean;
  inviterRewardXp: number;
  inviterRewardPremiumDays: number;
  inviteeRewardXp: number;
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
  inviterRewardXp: number;
  inviterRewardPremiumDays: number;
}

export interface ReferralMilestoneProgress {
  key: string;
  title: string;
  referralsRequired: number;
  currentReferrals: number;
  rewardXp: number;
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
  totalXpEarned: number;
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
  inviteeAwardedXp: number;
  inviteeAwardedPremiumDays: number;
  inviterAwardedXp: number;
  inviterAwardedPremiumDays: number;
  newlyAwardedMilestones: ReferralMilestoneProgress[];
}
