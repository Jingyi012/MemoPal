export interface ReferralMilestone {
  key: string;
  title: string;
  referralsRequired: number;
  rewardXp: number;
  rewardPremiumDays: number;
  rewardLabel: string;
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
  milestones: ReferralMilestone[];
}

export const REFERRAL_MILESTONE_SCHEMA = {
  type: "object",
  title: "Referral Milestone",
  properties: {
    key: {
      type: "string",
      title: "Key",
      description: "Unique identifier",
      minLength: 1,
      maxLength: 50,
      pattern: "^[a-z_0-9]+$",
    },
    title: {
      type: "string",
      title: "Title",
      description: "Milestone display name",
      minLength: 1,
      maxLength: 100,
    },
    referralsRequired: {
      type: "number",
      title: "Referrals Required",
      description: "Number of successful referrals to unlock",
      minimum: 1,
    },
    rewardXp: {
      type: "number",
      title: "Reward XP",
      description: "XP reward for reaching this milestone",
      minimum: 0,
    },
    rewardPremiumDays: {
      type: "number",
      title: "Premium Days Reward",
      description: "Premium days awarded for reaching this milestone",
      minimum: 0,
    },
    rewardLabel: {
      type: "string",
      title: "Reward Label",
      description: "Human-readable reward description",
      minLength: 1,
      maxLength: 200,
    },
    isActive: {
      type: "boolean",
      title: "Active",
      description: "Whether this milestone is currently active",
      default: true,
    },
    sortOrder: {
      type: "number",
      title: "Sort Order",
      description: "Display order",
      minimum: 0,
    },
  },
  required: [
    "key",
    "title",
    "referralsRequired",
    "rewardXp",
    "rewardPremiumDays",
    "rewardLabel",
    "isActive",
    "sortOrder",
  ],
  additionalProperties: false,
} as const;

export const REFERRAL_PROGRAM_CONFIG_SCHEMA = {
  type: "object",
  title: "Referral Program Configuration",
  description: "Configure the referral program settings and rewards",
  properties: {
    isEnabled: {
      type: "boolean",
      title: "Program Enabled",
      description: "Whether the referral program is active",
      default: true,
    },
    inviterRewardXp: {
      type: "number",
      title: "Inviter Reward XP",
      description: "XP reward for each successful referral (inviter)",
      minimum: 0,
      default: 80,
    },
    inviterRewardPremiumDays: {
      type: "number",
      title: "Inviter Premium Days",
      description: "Premium days awarded for each successful referral",
      minimum: 0,
      default: 3,
    },
    inviteeRewardXp: {
      type: "number",
      title: "Invitee Reward XP",
      description: "XP reward for signing up via referral (invitee)",
      minimum: 0,
      default: 40,
    },
    inviteeRewardPremiumDays: {
      type: "number",
      title: "Invitee Premium Days",
      description: "Premium days awarded when signing up via referral",
      minimum: 0,
      default: 2,
    },
    maxSuccessfulReferralsPerUser: {
      type: "number",
      title: "Max Referrals Per User",
      description: "Maximum number of successful referrals a user can make",
      minimum: 1,
      default: 100,
    },
    milestones: {
      type: "array",
      title: "Referral Milestones",
      description: "Bonus rewards for reaching referral milestones",
      items: REFERRAL_MILESTONE_SCHEMA,
      minItems: 1,
    },
  },
  required: [
    "isEnabled",
    "inviterRewardXp",
    "inviterRewardPremiumDays",
    "inviteeRewardXp",
    "inviteeRewardPremiumDays",
    "maxSuccessfulReferralsPerUser",
    "milestones",
  ],
  additionalProperties: false,
} as const;

export const REFERRAL_PROGRAM_CONFIG_DEFAULT: ReferralProgramConfig = {
  isEnabled: true,
  inviterRewardXp: 80,
  inviterRewardPremiumDays: 3,
  inviteeRewardXp: 40,
  inviteeRewardPremiumDays: 2,
  maxSuccessfulReferralsPerUser: 100,
  milestones: [
    {
      key: "referral_1",
      title: "First Invite",
      referralsRequired: 1,
      rewardXp: 100,
      rewardPremiumDays: 3,
      rewardLabel: "100 XP + 3 Premium Days",
      isActive: true,
      sortOrder: 1,
    },
    {
      key: "referral_3",
      title: "Community Starter",
      referralsRequired: 3,
      rewardXp: 250,
      rewardPremiumDays: 7,
      rewardLabel: "250 XP + 7 Premium Days",
      isActive: true,
      sortOrder: 2,
    },
    {
      key: "referral_5",
      title: "Memory Ambassador",
      referralsRequired: 5,
      rewardXp: 500,
      rewardPremiumDays: 14,
      rewardLabel: "500 XP + 14 Premium Days",
      isActive: true,
      sortOrder: 3,
    },
    {
      key: "referral_10",
      title: "Master Connector",
      referralsRequired: 10,
      rewardXp: 1000,
      rewardPremiumDays: 30,
      rewardLabel: "1000 XP + 30 Premium Days",
      isActive: true,
      sortOrder: 4,
    },
  ],
};
