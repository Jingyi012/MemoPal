import { systemSettingsApi } from '@/api/systemSettings';
import { createSystemSettingsRepository } from '@/repositories/systemSettings.repo';
import { XpConfig } from '@/types/xpConfigs';

const repo = createSystemSettingsRepository();
const SYNC_COOLDOWN_MS = 60 * 60 * 1000;
let lastSyncAt = 0;
let inFlightSync: Promise<void> | null = null;

async function syncXpConfigsFromRemote(force = false): Promise<void> {
  if (inFlightSync) return inFlightSync;

  const shouldSync = force || Date.now() - lastSyncAt >= SYNC_COOLDOWN_MS;
  if (!shouldSync) return;

  inFlightSync = (async () => {
    try {
      const remote = await systemSettingsApi.getXpConfigs();
      if (remote) {
        await repo.syncSetting(remote);
      }
      lastSyncAt = Date.now();
    } catch (error) {
      console.warn('Failed to sync XP config from backend, using local data:', error);
    }
  })();

  try {
    await inFlightSync;
  } finally {
    inFlightSync = null;
  }
}

export async function getXpConfigs(options?: { forceRemote?: boolean }): Promise<XpConfig[]> {
  await syncXpConfigsFromRemote(options?.forceRemote ?? false);
  return await repo.getXpConfigs();
}

export async function getXpConfigBySourceType(sourceType: string): Promise<XpConfig | null> {
  const allConfigs = await getXpConfigs();
  return allConfigs.find((c) => c.sourceType === sourceType) ?? null;
}
