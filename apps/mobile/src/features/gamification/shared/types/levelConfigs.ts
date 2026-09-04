export interface LevelConfig {
  level: number;
  requiredXp: number;
  title: string;
  titleZh?: string;
}

export interface LevelTitleConfig {
  level: number;
  titleEn: string;
  titleZh: string;
}

export interface LevelProgressConfig {
  xpPerLevel: number;
  levelTitles: LevelTitleConfig[];
}
