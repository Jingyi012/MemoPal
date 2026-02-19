import { levelConfigApi } from '@/api/levelConfig';
import { createLevelConfigRepository } from '@/repositories/levelConfig.repo';

const repo = createLevelConfigRepository();

export async function getLevelConfigs(): Promise<any[]> {
  try {
    const remote = await levelConfigApi.getAll();
    if (remote && remote.length > 0) {
      await repo.upsertMany(remote);
    }
  } catch (error) {
    console.warn('Failed to sync level configs from backend, using local data:', error);
  }

  return await repo.getAll();
}

export async function getLevelByXp(totalXp: number): Promise<number> {
  return await repo.getLevelByXp(totalXp);
}

export async function getXpRequiredForLevel(level: number): Promise<number> {
  return await repo.getXpRequiredForLevel(level);
}

export async function getByLevel(currentLevel: number): Promise<any | null> {
  return await repo.getByLevel(currentLevel);
}

export async function getNextLevel(currentLevel: number): Promise<any | null> {
  return await repo.getNextLevel(currentLevel);
}
