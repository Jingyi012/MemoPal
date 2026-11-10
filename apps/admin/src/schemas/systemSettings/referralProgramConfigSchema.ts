export interface ReferralMilestone {
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
    rewardAiCredits: {
      type: "number",
      title: "Reward AI credits",
      description: "AI credits reward for reaching this milestone",
      minimum: 0,
    },
    rewardPremiumDays: {
      type: "number",
      title: "Premium Days Reward",
      description: "Premium days awarded for reaching this milestone",
      minimum: 0,
    },
    rewardLabel: {
      type: ["string", "null"],
      title: "Reward Label",
      description: "Human-readable reward description",
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
    "rewardAiCredits",
    "rewardPremiumDays",
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
    inviterRewardAiCredits: {
      type: "number",
      title: "Inviter Reward AI credits",
      description: "AI credits reward for each successful referral (inviter)",
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
    inviteeRewardAiCredits: {
      type: "number",
      title: "Invitee Reward AI credits",
      description: "AI credits reward for signing up via referral (invitee)",
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
    "inviterRewardAiCredits",
    "inviterRewardPremiumDays",
    "inviteeRewardAiCredits",
    "inviteeRewardPremiumDays",
    "maxSuccessfulReferralsPerUser",
    "milestones",
  ],
  additionalProperties: false,
} as const;

export const REFERRAL_PROGRAM_CONFIG_DEFAULT: ReferralProgramConfig = {
  isEnabled: true,
  inviterRewardAiCredits: 80,
  inviterRewardPremiumDays: 3,
  inviteeRewardAiCredits: 40,
  inviteeRewardPremiumDays: 2,
  maxSuccessfulReferralsPerUser: 100,
  milestones: [
    {
      key: "referral_1",
      title: "First Invite",
      referralsRequired: 1,
      rewardAiCredits: 100,
      rewardPremiumDays: 3,
      rewardLabel: "100 AI credits + 3 Premium Days",
      isActive: true,
      sortOrder: 1,
    },
    {
      key: "referral_3",
      title: "Community Starter",
      referralsRequired: 3,
      rewardAiCredits: 250,
      rewardPremiumDays: 7,
      rewardLabel: "250 AI credits + 7 Premium Days",
      isActive: true,
      sortOrder: 2,
    },
    {
      key: "referral_5",
      title: "Memory Ambassador",
      referralsRequired: 5,
      rewardAiCredits: 500,
      rewardPremiumDays: 14,
      rewardLabel: "500 AI credits + 14 Premium Days",
      isActive: true,
      sortOrder: 3,
    },
    {
      key: "referral_10",
      title: "Master Connector",
      referralsRequired: 10,
      rewardAiCredits: 1000,
      rewardPremiumDays: 30,
      rewardLabel: "1000 AI credits + 30 Premium Days",
      isActive: true,
      sortOrder: 4,
    },
  ],
};
