import { FeatureLimits, userStatsApi } from '@/api/userStats';
import { createFeatureLimitsRepository } from '@/repositories/featureLimits.repo';

const repo = createFeatureLimitsRepository();

export const DEFAULT_FREE_LIMITS: FeatureLimits = {
  isPremium: false,
  customPalaces: 0,
  customLessonsPerPalace: 5,
  customLocationsPerPalace: 15,
  customWordsPerLesson: 25,
};

export const DEFAULT_PREMIUM_LIMITS: FeatureLimits = {
  isPremium: true,
  customPalaces: 20,
  customLessonsPerPalace: 50,
  customLocationsPerPalace: 100,
  customWordsPerLesson: 200,
};

export function getFeatureLimitsFallback(isPremium: boolean): FeatureLimits {
  return isPremium ? DEFAULT_PREMIUM_LIMITS : DEFAULT_FREE_LIMITS;
}

export async function getFeatureLimits(userId: string, isPremium: boolean): Promise<FeatureLimits> {
  const fallback = getFeatureLimitsFallback(isPremium);

  try {
    const remote = await userStatsApi.getFeatureLimits();
    await repo.upsert(userId, remote);
    return remote;
  } catch (error) {
    console.warn('Failed to fetch feature limits from backend, using local data:', error);
  }

  const local = await repo.getByUserId(userId);
  return local ?? fallback;
}
