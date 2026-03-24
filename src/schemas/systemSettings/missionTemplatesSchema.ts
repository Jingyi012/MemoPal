export interface MissionTemplate {
  key: string;
  title: string;
  description: string;
  metricType: string;
  period: string;
  targetValue: number;
  rewardXp: number;
  sortOrder: number;
  isActive: boolean;
}

export interface MissionTemplatesConfig {
  templates: MissionTemplate[];
}

export const MISSION_TEMPLATE_SCHEMA = {
  type: "object",
  title: "Mission Template",
  properties: {
    key: {
      type: "string",
      title: "Key",
      description: "Unique identifier for the mission",
      minLength: 1,
      maxLength: 50,
      pattern: "^[a-z_]+$",
    },
    title: {
      type: "string",
      title: "Title",
      description: "Display title for the mission",
      minLength: 1,
      maxLength: 100,
    },
    description: {
      type: "string",
      title: "Description",
      description: "Detailed description of the mission",
      minLength: 1,
      maxLength: 500,
    },
    metricType: {
      type: "string",
      title: "Metric Type",
      description:
        "Type of metric being tracked (e.g., reviews_completed, xp_earned)",
      minLength: 1,
      maxLength: 50,
      enum: [
        "reviews_completed",
        "lessons_completed",
        "xp_earned",
        "streak_days",
        "mastered_lessons",
      ],
    },
    period: {
      type: "string",
      title: "Period",
      description: "Time period for the mission",
      enum: ["daily", "weekly", "monthly", "all_time"],
    },
    targetValue: {
      type: "number",
      title: "Target Value",
      description: "Target value to complete the mission",
      minimum: 1,
    },
    rewardXp: {
      type: "number",
      title: "Reward XP",
      description: "XP reward for completing the mission",
      minimum: 0,
    },
    sortOrder: {
      type: "number",
      title: "Sort Order",
      description: "Display order in the mission list",
      minimum: 0,
    },
    isActive: {
      type: "boolean",
      title: "Active",
      description: "Whether the mission is currently active",
      default: true,
    },
  },
  required: [
    "key",
    "title",
    "description",
    "metricType",
    "period",
    "targetValue",
    "rewardXp",
    "sortOrder",
    "isActive",
  ],
  additionalProperties: false,
};

export const MISSION_TEMPLATES_CONFIG_SCHEMA = {
  type: "object",
  title: "Mission Templates Configuration",
  description: "Define available mission templates",
  properties: {
    templates: {
      type: "array",
      title: "Mission Templates",
      items: MISSION_TEMPLATE_SCHEMA,
      minItems: 1,
    },
  },
  required: ["templates"],
  additionalProperties: false,
} as const;

export const MISSION_TEMPLATES_CONFIG_DEFAULT: MissionTemplatesConfig = {
  templates: [
    {
      key: "daily_review_rhythm",
      title: "Daily Review Rhythm",
      description: "Complete 3 reviews today to keep memory traces fresh.",
      metricType: "reviews_completed",
      period: "daily",
      targetValue: 3,
      rewardXp: 25,
      sortOrder: 1,
      isActive: true,
    },
    {
      key: "weekly_lesson_finish",
      title: "Weekly Lesson Finisher",
      description: "Finish 2 lessons this week to maintain momentum.",
      metricType: "lessons_completed",
      period: "weekly",
      targetValue: 2,
      rewardXp: 50,
      sortOrder: 2,
      isActive: true,
    },
    {
      key: "weekly_xp_build",
      title: "Weekly XP Build",
      description: "Earn 120 XP this week through learning and reviews.",
      metricType: "xp_earned",
      period: "weekly",
      targetValue: 120,
      rewardXp: 40,
      sortOrder: 3,
      isActive: true,
    },
    {
      key: "streak_guard",
      title: "Streak Guard",
      description: "Keep at least a 5-day streak to reinforce consistency.",
      metricType: "streak_days",
      period: "all_time",
      targetValue: 5,
      rewardXp: 35,
      sortOrder: 4,
      isActive: true,
    },
    {
      key: "mastery_drive",
      title: "Mastery Drive",
      description:
        "Master 3 lessons in total to strengthen long-term retention.",
      metricType: "mastered_lessons",
      period: "all_time",
      targetValue: 3,
      rewardXp: 80,
      sortOrder: 5,
      isActive: true,
    },
  ],
};
