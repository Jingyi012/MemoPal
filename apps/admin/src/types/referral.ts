export interface ReferralMilestoneConfigDto {
  key: string;
  title: string;
  referralsRequired: number;
  rewardXp: number;
  rewardPremiumDays: number;
  rewardLabel?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ReferralProgramConfigDto {
  isEnabled: boolean;
  inviterRewardXp: number;
  inviterRewardPremiumDays: number;
  inviteeRewardXp: number;
  inviteeRewardPremiumDays: number;
  maxSuccessfulReferralsPerUser: number;
  milestones: ReferralMilestoneConfigDto[];
}

export interface AdminReferralUserDto {
  userId: string;
  displayName: string;
  email: string;
  referralCode: string;
  successfulReferrals: number;
  totalXpAwarded: number;
  totalPremiumDaysAwarded: number;
  lastReferralAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReferralRecordDto {
  id: string;
  referralCode: string;
  referrerUserId: string;
  referrerDisplayName: string;
  referrerEmail: string;
  refereeUserId: string;
  refereeDisplayName: string;
  refereeEmail: string;
  redeemedAt: string;
  inviterRewardXp: number;
  inviterRewardPremiumDays: number;
  inviteeRewardXp: number;
  inviteeRewardPremiumDays: number;
}
