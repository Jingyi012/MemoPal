import { levelConfigApi } from '@/api/levelConfig';
import { createLevelConfigRepository } from '@/repositories/levelConfig.repo';
import { LevelConfigs } from '@/types/levelConfigs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const repo = createLevelConfigRepository();
const LEVEL_CONFIG_VERSION_KEY = 'memopal.level-configs.version';

// --- 1 hour ---
const VERSION_CHECK_COOLDOWN_MS = 60 * 60 * 1000;

let lastVersionCheckAt = 0;
let inFlightSync: Promise<void> | null = null;
let cachedVersion: string | null | undefined;

let memoryCachedConfigs: LevelConfigs[] | null = null;

async function getStoredVersion(): Promise<string | null> {
  if (cachedVersion !== undefined) return cachedVersion;
  cachedVersion = await AsyncStorage.getItem(LEVEL_CONFIG_VERSION_KEY);
  return cachedVersion;
}

async function setStoredVersion(version: string): Promise<void> {
  cachedVersion = version;
  await AsyncStorage.setItem(LEVEL_CONFIG_VERSION_KEY, version);
}

function buildFallbackVersion(configs: any[]): string {
  const latestTicks = configs.reduce((max, item) => {
    const value = new Date(item.updatedAt ?? item.createdAt ?? 0).getTime();
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `${configs.length}:${latestTicks}`;
}

async function syncLevelConfigsFromRemote(options?: {
  forceDownload?: boolean;
  localCount?: number;
}): Promise<void> {
  const forceDownload = options?.forceDownload ?? false;
  const localCount = options?.localCount ?? 0;

  // 1. Prevent overlapping sync calls
  if (inFlightSync) return inFlightSync;

  const now = Date.now();
  const isCooldownActive = now - lastVersionCheckAt < VERSION_CHECK_COOLDOWN_MS;

  // 2. Decide if we even need to talk to the backend
  // Only talk to backend if forced, if DB is empty, or if cooldown expired
  const shouldCheckVersion = forceDownload || localCount === 0 || !isCooldownActive;

  if (!shouldCheckVersion) return;

  inFlightSync = (async () => {
    try {
      const localVersion = await getStoredVersion();

      // Step A: Get Remote Version (Small Request)
      const versionPayload = await levelConfigApi.getVersion();
      const remoteVersion = versionPayload.version;
      lastVersionCheckAt = Date.now();

      // Step B: Only download data if version mismatch or forced
      const needsFullDownload = forceDownload || localCount === 0 || remoteVersion !== localVersion;

      if (needsFullDownload) {
        const remoteData = await levelConfigApi.getAll();
        await repo.replaceAll(remoteData);

        const newVersion = remoteVersion || buildFallbackVersion(remoteData);
        await setStoredVersion(newVersion);

        memoryCachedConfigs = remoteData;
      }
    } catch (error) {
      console.warn('LevelConfig Sync Failed:', error);
    }
  })();

  try {
    await inFlightSync;
  } finally {
    inFlightSync = null;
  }
}

/**
 * The primary way to get configs.
 * Uses Memory -> then Local DB -> then Remote (if stale).
 */
async function ensureLevelConfigsLoaded(forceRemote = false): Promise<LevelConfigs[]> {
  // 1. Return memory cache immediately if valid and not forcing remote
  if (memoryCachedConfigs && !forceRemote && memoryCachedConfigs.length > 0) {
    // Background sync check: if cooldown expired, trigger sync but don't await it
    // This makes the UI snappy while keeping data fresh
    if (Date.now() - lastVersionCheckAt >= VERSION_CHECK_COOLDOWN_MS) {
      syncLevelConfigsFromRemote({ forceDownload: false, localCount: memoryCachedConfigs.length });
    }
    return memoryCachedConfigs;
  }

  // 2. If memory empty, check Local DB
  const local = await repo.getAll();
  memoryCachedConfigs = local;

  // 3. Sync from remote if needed
  await syncLevelConfigsFromRemote({
    forceDownload: forceRemote,
    localCount: local.length,
  });

  // 4. Update memory cache again after sync and return
  memoryCachedConfigs = await repo.getAll();
  return memoryCachedConfigs;
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
  currentLevelConfig: any | null;
  nextLevelConfig: any | null;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  totalXp: number;
}> {
  const configs = await ensureLevelConfigsLoaded(false);
  const ordered = [...configs].sort((a, b) => a.level - b.level);

  let resolvedLevel = 1;
  if (typeof authoritativeLevel === 'number' && authoritativeLevel > 0) {
    resolvedLevel = authoritativeLevel;
  } else {
    for (const config of ordered) {
      if (config.requiredXp <= totalXp) {
        resolvedLevel = config.level;
      } else {
        break;
      }
    }
  }

  const currentLevelConfig = ordered.find((item) => item.level === resolvedLevel) ?? null;
  const nextLevelConfig = ordered.find((item) => item.level > resolvedLevel) ?? null;
  const currentLevelXp = currentLevelConfig?.requiredXp ?? 0;
  const nextLevelXp = nextLevelConfig?.requiredXp ?? currentLevelXp + 1000;

  return {
    currentLevel: resolvedLevel,
    currentLevelConfig,
    nextLevelConfig,
    xpInCurrentLevel: totalXp - currentLevelXp,
    xpToNextLevel: Math.max(0, nextLevelXp - totalXp),
    totalXp,
  };
}

// Optimization for single-item lookups
export async function getByLevel(currentLevel: number): Promise<LevelConfigs | null> {
  const configs = await ensureLevelConfigsLoaded(false);
  return configs.find((c) => c.level === currentLevel) ?? null;
}

export async function getNextLevel(currentLevel: number): Promise<LevelConfigs | null> {
  const configs = await ensureLevelConfigsLoaded(false);
  return configs.find((c) => c.level === currentLevel + 1) ?? null;
}

// Re-use ensureLevelConfigsLoaded for others to maintain memory cache
export async function getLevelByXp(totalXp: number, authoritativeLevel?: number): Promise<number> {
  if (typeof authoritativeLevel === 'number' && authoritativeLevel > 0) return authoritativeLevel;
  const configs = await ensureLevelConfigsLoaded(false);
  const ordered = [...configs].sort((a, b) => b.level - a.level);
  const found = ordered.find((c) => totalXp >= c.requiredXp);
  return found ? found.level : 1;
}

export async function getXpRequiredForLevel(level: number): Promise<number> {
  const config = await getByLevel(level);
  return config?.requiredXp ?? 0;
}
