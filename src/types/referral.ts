export type ReferralStatus = 'active' | 'premium' | 'inactive';

export interface ReferralUser {
  id: string;
  name: string;
  joinedDate: string; // ISO string
  status: ReferralStatus;
}

export interface ReferralRewards {
  xp: number;
}

export interface ReferralData {
  referralCode: string;
  referralsCount: number;
  totalRewardsEarned: ReferralRewards;
  referralsList: ReferralUser[];
  milestones: ReferralMilestone[];
}

export interface ReferralMilestone {
  id: string;
  referralsRequired: number;
  reward: string;
  rewardType: 'xp' | 'premium' | 'exclusive';
}
