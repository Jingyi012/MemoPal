export interface XpConfigItem {
  key: string;
  sourceType: string;
  baseXp: number;
  variableXp: number;
  isActive: boolean;
}

export interface XpConfigsConfig {
  configs: XpConfigItem[];
}

export const XP_CONFIG_ITEM_SCHEMA = {
  type: "object",
  title: "XP Config Entry",
  properties: {
    key: { type: "string", title: "Key", minLength: 1 },
    sourceType: {
      type: "string",
      title: "Source Type",
      enum: [
        "review_complete",
        "lesson_initial_completion",
        "lesson_complete",
        "word_mastered",
        "streak_bonus",
        "mission_complete",
        "manual_adjustment",
      ],
    },
    baseXp: { type: "number", title: "Base XP", minimum: 0 },
    variableXp: { type: "number", title: "Variable XP", minimum: 0 },
    isActive: { type: "boolean", title: "Active", default: true },
  },
  required: ["key", "sourceType", "baseXp", "variableXp", "isActive"],
  additionalProperties: false,
} as const;

export const XP_CONFIGS_SCHEMA = {
  type: "object",
  title: "XP Configurations",
  properties: {
    configs: {
      type: "array",
      title: "Configs",
      items: XP_CONFIG_ITEM_SCHEMA,
      minItems: 1,
    },
  },
  required: ["configs"],
  additionalProperties: false,
} as const;

export const XP_CONFIGS_DEFAULT: XpConfigsConfig = {
  configs: [
    {
      key: "xp-review-complete",
      sourceType: "review_complete",
      baseXp: 15,
      variableXp: 5,
      isActive: true,
    },
    {
      key: "xp-lesson-initial-completion",
      sourceType: "lesson_initial_completion",
      baseXp: 25,
      variableXp: 10,
      isActive: true,
    },
    {
      key: "xp-lesson-complete",
      sourceType: "lesson_complete",
      baseXp: 40,
      variableXp: 15,
      isActive: true,
    },
    {
      key: "xp-word-mastered",
      sourceType: "word_mastered",
      baseXp: 8,
      variableXp: 2,
      isActive: true,
    },
    {
      key: "xp-streak-bonus",
      sourceType: "streak_bonus",
      baseXp: 12,
      variableXp: 0,
      isActive: true,
    },
    {
      key: "xp-mission-complete",
      sourceType: "mission_complete",
      baseXp: 35,
      variableXp: 0,
      isActive: true,
    },
    {
      key: "xp-manual-adjustment",
      sourceType: "manual_adjustment",
      baseXp: 50,
      variableXp: 0,
      isActive: true,
    },
  ],
};
