import { xpConfigApi } from '@/api/xpConfig';
import { SourceType } from '@/enums/sourceType';
import { createXpConfigRepository } from '@/repositories/xpConfig.repo';
import { XpConfig } from '@/types/xpConfigs';

const repo = createXpConfigRepository();

export async function getXpConfigs(): Promise<XpConfig[]> {
  try {
    const remote = await xpConfigApi.getAll();
    if (remote && remote.length > 0) {
      await repo.upsertMany(remote);
    }
  } catch (error) {
    console.warn('Failed to sync XP configs from backend, using local data:', error);
  }

  return await repo.getAll();
}

export async function getXpConfigBySourceType(sourceType: string) {
  try {
    const remote = await xpConfigApi.getBySourceType(sourceType);
    if (remote) {
      await repo.upsertMany([remote]);
    }
  } catch (error) {
    console.warn('Failed to sync XP config, using local data:', error);
  }

  return await repo.getBySourceType(sourceType as SourceType);
}
