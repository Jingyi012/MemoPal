import { systemSettingsApi } from '@/api/systemSettings';
import { LevelConfigs } from '@/types/levelConfigs';
import { createSystemSettingsRepository } from '@/repositories/systemSettings.repo';

const repo = createSystemSettingsRepository();

// 1 hour cache window for remote pulls.
const SYNC_COOLDOWN_MS = 60 * 60 * 1000;
let lastSyncAt = 0;
let inFlightSync: Promise<void> | null = null;

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

async function syncLevelConfigsFromRemote(force = false): Promise<void> {
  if (inFlightSync) return inFlightSync;

  const shouldSync = force || Date.now() - lastSyncAt >= SYNC_COOLDOWN_MS;
  if (!shouldSync) return;

  inFlightSync = (async () => {
    try {
      const remote = await systemSettingsApi.getLevelConfigs();
      if (remote) {
        await repo.syncSetting(remote);
      }
      lastSyncAt = Date.now();
    } catch (error) {
      console.warn('Level config sync failed, using local cache:', error);
    }
  })();

  try {
    await inFlightSync;
  } finally {
    inFlightSync = null;
  }
}

async function ensureLevelConfigsLoaded(forceRemote = false): Promise<LevelConfigs[]> {
  await syncLevelConfigsFromRemote(forceRemote);
  return await repo.getLevelConfigs();
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
