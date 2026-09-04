import { systemSettingsApi } from '@/core/settings/api/systemSettings';
import type {
  LevelConfig,
  LevelTitleConfig,
  LevelProgressConfig,
} from '@/features/gamification/shared/types/levelConfigs';
import {
  DEFAULT_LEVEL_TITLES,
  getLevelTitleForLevel,
} from '../utils/levelTitles';

const DEFAULT_XP_PER_LEVEL = 100;

function parseLevelTitles(value: unknown): LevelTitleConfig[] {
  if (!Array.isArray(value)) return DEFAULT_LEVEL_TITLES;

  const titles = value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      level: Number(item.level),
      titleEn: typeof item.titleEn === 'string' ? item.titleEn.trim() : '',
      titleZh: typeof item.titleZh === 'string' ? item.titleZh.trim() : '',
    }))
    .filter((item) => Number.isInteger(item.level) && item.level >= 1 && item.titleEn.length > 0 && item.titleZh.length > 0)
    .sort((left, right) => left.level - right.level);

  const unique = titles.filter((item, index) => index === titles.findIndex((candidate) => candidate.level === item.level));
  return unique.length ? unique : DEFAULT_LEVEL_TITLES;
}

function parseConfig(value?: string | null): LevelProgressConfig {
  if (!value) return { xpPerLevel: DEFAULT_XP_PER_LEVEL, levelTitles: DEFAULT_LEVEL_TITLES };

  try {
    let parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    const source = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
    const xpPerLevel = Number(source.xpPerLevel);
    return {
      xpPerLevel: Number.isFinite(xpPerLevel)
        ? Math.max(10, Math.trunc(xpPerLevel))
        : DEFAULT_XP_PER_LEVEL,
      levelTitles: parseLevelTitles(source.levelTitles),
    };
  } catch {
    return { xpPerLevel: DEFAULT_XP_PER_LEVEL, levelTitles: DEFAULT_LEVEL_TITLES };
  }
}

function levelConfig(level: number, xpPerLevel: number, levelTitles: LevelTitleConfig[]): LevelConfig {
  const title = getLevelTitleForLevel(level, levelTitles);
  return {
    level,
    requiredXp: Math.max(0, level - 1) * xpPerLevel,
    title: title.titleEn,
    titleZh: title.titleZh,
  };
}

export async function getLevelConfigs(): Promise<LevelProgressConfig> {
  const setting = await systemSettingsApi.getLevelConfigs();
  return parseConfig(setting?.value);
}

export async function getLevelProgress(
  totalXp: number,
  _authoritativeLevel?: number,
): Promise<{
  currentLevel: number;
  currentLevelConfig: LevelConfig;
  nextLevelConfig: LevelConfig;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  totalXp: number;
}> {
  const { xpPerLevel, levelTitles } = await getLevelConfigs();
  const safeXp = Math.max(0, Math.trunc(totalXp));
  const currentLevel = Math.floor(safeXp / xpPerLevel) + 1;
  const xpInCurrentLevel = safeXp % xpPerLevel;

  return {
    currentLevel,
    currentLevelConfig: levelConfig(currentLevel, xpPerLevel, levelTitles),
    nextLevelConfig: levelConfig(currentLevel + 1, xpPerLevel, levelTitles),
    xpInCurrentLevel,
    xpToNextLevel: xpPerLevel - xpInCurrentLevel,
    totalXp: safeXp,
  };
}
