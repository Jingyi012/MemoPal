import { systemSettingsApi } from '@/core/settings/api/systemSettings';
import type {
  LevelConfig,
  LevelProgressConfig,
} from '@/features/gamification/shared/types/levelConfigs';

const DEFAULT_XP_PER_LEVEL = 100;

function parseConfig(value?: string | null): LevelProgressConfig {
  if (!value) return { xpPerLevel: DEFAULT_XP_PER_LEVEL };

  try {
    let parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    const xpPerLevel = Number(
      parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>).xpPerLevel
        : DEFAULT_XP_PER_LEVEL,
    );
    return {
      xpPerLevel: Number.isFinite(xpPerLevel)
        ? Math.max(10, Math.trunc(xpPerLevel))
        : DEFAULT_XP_PER_LEVEL,
    };
  } catch {
    return { xpPerLevel: DEFAULT_XP_PER_LEVEL };
  }
}

function titleForLevel(level: number) {
  if (level >= 20) return 'Memory Master';
  if (level >= 10) return 'Mind Architect';
  if (level >= 5) return 'Memory Navigator';
  if (level >= 2) return 'Memory Apprentice';
  return 'Memory Explorer';
}

function levelConfig(level: number, xpPerLevel: number): LevelConfig {
  return {
    level,
    requiredXp: Math.max(0, level - 1) * xpPerLevel,
    title: titleForLevel(level),
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
  const { xpPerLevel } = await getLevelConfigs();
  const safeXp = Math.max(0, Math.trunc(totalXp));
  const currentLevel = Math.floor(safeXp / xpPerLevel) + 1;
  const xpInCurrentLevel = safeXp % xpPerLevel;

  return {
    currentLevel,
    currentLevelConfig: levelConfig(currentLevel, xpPerLevel),
    nextLevelConfig: levelConfig(currentLevel + 1, xpPerLevel),
    xpInCurrentLevel,
    xpToNextLevel: xpPerLevel - xpInCurrentLevel,
    totalXp: safeXp,
  };
}
