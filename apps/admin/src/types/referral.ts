export interface ReferralMilestoneConfigDto {
  key: string;
  title: string;
  referralsRequired: number;
  rewardAiCredits: number;
  rewardPremiumDays: number;
  rewardLabel?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ReferralProgramConfigDto {
  isEnabled: boolean;
  inviterRewardAiCredits: number;
  inviterRewardPremiumDays: number;
  inviteeRewardAiCredits: number;
  inviteeRewardPremiumDays: number;
  maxSuccessfulReferralsPerUser: number;
  milestones: ReferralMilestoneConfigDto[];
}

export interface ReferralUserView {
  userId: string;
  displayName: string;
  email: string;
  referralCode: string;
  successfulReferrals: number;
  totalAiCreditsAwarded: number;
  totalPremiumDaysAwarded: number;
  lastReferralAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralRecordView {
  id: string;
  referralCode: string;
  referrerUserId: string;
  referrerDisplayName: string;
  referrerEmail: string;
  refereeUserId: string;
  refereeDisplayName: string;
  refereeEmail: string;
  redeemedAt: string;
  inviterRewardAiCredits: number;
  inviterRewardPremiumDays: number;
  inviteeRewardAiCredits: number;
  inviteeRewardPremiumDays: number;
}
