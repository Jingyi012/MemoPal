import { systemSettingsApi } from '@/core/settings/api/systemSettings';
import { LevelConfigs } from '@/features/gamification/shared/types/levelConfigs';

function getComputedLevelFromXp(configs: LevelConfigs[], totalXp: number): number {
  if (!configs.length) return 1;

  const orderedByRequiredXp = [...configs].sort((a, b) => {
    if (a.requiredXp !== b.requiredXp) return a.requiredXp - b.requiredXp;
    return a.level - b.level;
  });

  let resolvedLevel = 1;
  for (const config of orderedByRequiredXp) {
    if (totalXp >= config.requiredXp) {
      resolvedLevel = config.level;
      continue;
    }
    break;
  }

  return Math.max(1, resolvedLevel);
}

async function ensureLevelConfigsLoaded(_forceRemote = false): Promise<LevelConfigs[]> {
  const setting = await systemSettingsApi.getLevelConfigs();
  if (!setting?.value) return [];

  try {
    const parsed = JSON.parse(setting.value) as unknown;
    const source = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).levels ??
          (parsed as Record<string, unknown>).configs ??
          (parsed as Record<string, unknown>).items)
        : [];
    if (!Array.isArray(source)) return [];
    return source
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        level: Number(item.level ?? 0),
        requiredXp: Number(item.requiredXp ?? 0),
        title: item.title ? String(item.title) : undefined,
        createdAt: String(item.createdAt ?? setting.createdAt),
        updatedAt: String(item.updatedAt ?? setting.updatedAt),
      }))
      .filter((item) => item.level > 0)
      .sort((a, b) => a.level - b.level);
  } catch {
    return [];
  }
}

export async function getLevelConfigs(options?: {
  forceRemote?: boolean;
}): Promise<LevelConfigs[]> {
  return await ensureLevelConfigsLoaded(options?.forceRemote ?? false);
}

export async function getLevelProgress(
  totalXp: number,
  authoritativeLevel?: number
): Promise<{
  currentLevel: number;
  currentLevelConfig: LevelConfigs | null;
  nextLevelConfig: LevelConfigs | null;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  totalXp: number;
}> {
  const configs = await ensureLevelConfigsLoaded(false);
  const ordered = [...configs].sort((a, b) => a.level - b.level);
  const resolvedLevel =
    ordered.length > 0
      ? getComputedLevelFromXp(ordered, totalXp)
      : typeof authoritativeLevel === 'number' && authoritativeLevel > 0
        ? authoritativeLevel
        : 1;

  const currentLevelConfig = ordered.find((item) => item.level === resolvedLevel) ?? null;
  const nextLevelConfig = ordered.find((item) => item.level > resolvedLevel) ?? null;
  const currentLevelXp = currentLevelConfig?.requiredXp ?? 0;
  const nextLevelXp = nextLevelConfig?.requiredXp ?? currentLevelXp + 1000;
  return {
    currentLevel: resolvedLevel,
    currentLevelConfig,
    nextLevelConfig,
    xpInCurrentLevel: Math.max(0, totalXp - currentLevelXp),
    xpToNextLevel: Math.max(0, nextLevelXp - totalXp),
    totalXp,
  };
}

export async function getByLevel(currentLevel: number): Promise<LevelConfigs | null> {
  const configs = await ensureLevelConfigsLoaded(false);
  return configs.find((c) => c.level === currentLevel) ?? null;
}

export async function getNextLevel(currentLevel: number): Promise<LevelConfigs | null> {
  const configs = await ensureLevelConfigsLoaded(false);
  return configs.find((c) => c.level === currentLevel + 1) ?? null;
}

export async function getLevelByXp(totalXp: number, authoritativeLevel?: number): Promise<number> {
  const configs = await ensureLevelConfigsLoaded(false);
  if (configs.length > 0) {
    return getComputedLevelFromXp(configs, totalXp);
  }

  if (typeof authoritativeLevel === 'number' && authoritativeLevel > 0) {
    return authoritativeLevel;
  }

  return 1;
}

export async function getXpRequiredForLevel(level: number): Promise<number> {
  const config = await getByLevel(level);
  return config?.requiredXp ?? 0;
}
