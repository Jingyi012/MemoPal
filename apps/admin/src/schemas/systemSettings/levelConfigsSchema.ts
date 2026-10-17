export interface LevelConfigsConfig {
  xpPerLevel: number;
  levelTitles: {
    level: number;
    titleEn: string;
    titleZh: string;
  }[];
}

export const LEVEL_CONFIGS_SCHEMA = {
  type: 'object',
  title: 'Level Progress',
  properties: {
    xpPerLevel: {
      type: 'number',
      title: 'XP required per level',
      description: 'Every level uses the same clear XP target.',
      minimum: 10,
      maximum: 100000,
    },
    levelTitles: {
      type: 'array',
      title: 'Level titles',
      description: 'Each row applies from its level until the next configured level.',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          level: {
            type: 'integer',
            title: 'Starting level',
            minimum: 1,
            maximum: 10000,
          },
          titleEn: {
            type: 'string',
            title: 'English title',
            minLength: 1,
            maxLength: 80,
          },
          titleZh: {
            type: 'string',
            title: 'Chinese title',
            minLength: 1,
            maxLength: 80,
          },
        },
        required: ['level', 'titleEn', 'titleZh'],
        additionalProperties: false,
      },
    },
  },
  required: ['xpPerLevel', 'levelTitles'],
  additionalProperties: false,
} as const;

export const LEVEL_CONFIGS_DEFAULT: LevelConfigsConfig = {
  xpPerLevel: 100,
  levelTitles: [
    { level: 1, titleEn: 'Memory Explorer', titleZh: '记忆探索者' },
    { level: 2, titleEn: 'Memory Apprentice', titleZh: '记忆学徒' },
    { level: 5, titleEn: 'Memory Navigator', titleZh: '记忆导航者' },
    { level: 10, titleEn: 'Mind Architect', titleZh: '思维建筑师' },
    { level: 15, titleEn: 'Recall Champion', titleZh: '回忆冠军' },
    { level: 20, titleEn: 'Memory Master', titleZh: '记忆大师' },
    { level: 30, titleEn: 'Mind Strategist', titleZh: '思维策略家' },
    { level: 40, titleEn: 'Memory Mentor', titleZh: '记忆导师' },
    { level: 50, titleEn: 'Memory Legend', titleZh: '记忆传奇' },
  ],
};
