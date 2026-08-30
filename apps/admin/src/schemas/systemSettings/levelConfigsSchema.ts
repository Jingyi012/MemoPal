export interface LevelConfigsConfig {
  xpPerLevel: number;
}

export const LEVEL_CONFIGS_SCHEMA = {
  type: "object",
  title: "Level Progress",
  properties: {
    xpPerLevel: {
      type: "number",
      title: "XP required per level",
      description: "Every level uses the same clear XP target.",
      minimum: 10,
      maximum: 100000,
    },
  },
  required: ["xpPerLevel"],
  additionalProperties: false,
} as const;

export const LEVEL_CONFIGS_DEFAULT: LevelConfigsConfig = {
  xpPerLevel: 100,
};
