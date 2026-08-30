export interface XpConfigsConfig {
  memoryLearnedXp: number;
  dueReviewXp: number;
  extraPracticeXp: number;
  extraPracticeDailyLimit: number;
}

export const XP_CONFIGS_SCHEMA = {
  type: "object",
  title: "Simple XP Rewards",
  properties: {
    memoryLearnedXp: {
      type: "number",
      title: "Learn a new memory",
      description: "Awarded once, after the first completed recall for a memory.",
      minimum: 0,
      maximum: 10000,
    },
    dueReviewXp: {
      type: "number",
      title: "Complete a due review",
      description: "Awarded after completing a scheduled review that is due.",
      minimum: 0,
      maximum: 10000,
    },
    extraPracticeXp: {
      type: "number",
      title: "Extra practice",
      description: "Awarded for an optional review completed before it is due.",
      minimum: 0,
      maximum: 10000,
    },
    extraPracticeDailyLimit: {
      type: "number",
      title: "Extra-practice rewards per memory each day",
      description: "Limits repeat rewards while still encouraging a daily visit.",
      minimum: 0,
      maximum: 10,
    },
  },
  required: [
    "memoryLearnedXp",
    "dueReviewXp",
    "extraPracticeXp",
    "extraPracticeDailyLimit",
  ],
  additionalProperties: false,
} as const;

export const XP_CONFIGS_DEFAULT: XpConfigsConfig = {
  memoryLearnedXp: 20,
  dueReviewXp: 10,
  extraPracticeXp: 5,
  extraPracticeDailyLimit: 1,
};
