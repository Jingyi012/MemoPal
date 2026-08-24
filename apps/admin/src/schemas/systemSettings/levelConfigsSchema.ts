export interface LevelConfigItem {
  level: number;
  requiredXp: number;
  title?: string;
}

export interface LevelConfigsConfig {
  levels: LevelConfigItem[];
}

export const LEVEL_CONFIG_ITEM_SCHEMA = {
  type: "object",
  title: "Level Config Entry",
  properties: {
    level: { type: "number", title: "Level", minimum: 1 },
    requiredXp: { type: "number", title: "Required XP", minimum: 0 },
    title: { type: "string", title: "Title" },
  },
  required: ["level", "requiredXp"],
  additionalProperties: false,
} as const;

export const LEVEL_CONFIGS_SCHEMA = {
  type: "object",
  title: "Level Configurations",
  properties: {
    levels: {
      type: "array",
      title: "Levels",
      items: LEVEL_CONFIG_ITEM_SCHEMA,
      minItems: 1,
    },
  },
  required: ["levels"],
  additionalProperties: false,
} as const;

export const LEVEL_CONFIGS_DEFAULT: LevelConfigsConfig = {
  levels: [
    { level: 1, requiredXp: 0, title: "Novice" },
    { level: 2, requiredXp: 120, title: "Apprentice" },
    { level: 3, requiredXp: 280, title: "Scholar" },
    { level: 4, requiredXp: 480, title: "Navigator" },
    { level: 5, requiredXp: 720, title: "Strategist" },
    { level: 6, requiredXp: 1000, title: "Mnemonist" },
    { level: 7, requiredXp: 1320, title: "Archivist" },
    { level: 8, requiredXp: 1680, title: "Mind Architect" },
    { level: 9, requiredXp: 2080, title: "Memory Master" },
    { level: 10, requiredXp: 2520, title: "Palace Sage" },
  ],
};
