import type { LevelTitleConfig } from '../types/levelConfigs';

export const DEFAULT_LEVEL_TITLES: LevelTitleConfig[] = [
  { level: 1, titleEn: 'Memory Explorer', titleZh: '记忆探索者' },
  { level: 2, titleEn: 'Memory Apprentice', titleZh: '记忆学徒' },
  { level: 5, titleEn: 'Memory Navigator', titleZh: '记忆导航者' },
  { level: 10, titleEn: 'Mind Architect', titleZh: '思维建筑师' },
  { level: 15, titleEn: 'Recall Champion', titleZh: '回忆冠军' },
  { level: 20, titleEn: 'Memory Master', titleZh: '记忆大师' },
  { level: 30, titleEn: 'Mind Strategist', titleZh: '思维策略家' },
  { level: 40, titleEn: 'Memory Mentor', titleZh: '记忆导师' },
  { level: 50, titleEn: 'Memory Legend', titleZh: '记忆传奇' },
];

export function getLevelTitleForLevel(
  level: number,
  levelTitles: LevelTitleConfig[] = DEFAULT_LEVEL_TITLES,
) {
  const applicable = levelTitles
    .filter((entry) => entry.level <= level)
    .sort((left, right) => right.level - left.level)[0];
  return applicable ?? DEFAULT_LEVEL_TITLES[0];
}
