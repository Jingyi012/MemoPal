import { FeatureLimits, userStatsApi } from '@/api/userStats';
import { createFeatureLimitsRepository } from '@/repositories/featureLimits.repo';

const repo = createFeatureLimitsRepository();

export const DEFAULT_FREE_LIMITS: FeatureLimits = {
  isPremium: false,
  customPalaces: { free: 0, premium: 0 },
  customLessonsPerPalace: { free: 5, premium: 5 },
  customLocationsPerPalace: { free: 15, premium: 15 },
  customWordsPerLesson: { free: 25, premium: 25 },
};

export const DEFAULT_PREMIUM_LIMITS: FeatureLimits = {
  isPremium: true,
  customPalaces: { free: 0, premium: 20 },
  customLessonsPerPalace: { free: 5, premium: 50 },
  customLocationsPerPalace: { free: 15, premium: 100 },
  customWordsPerLesson: { free: 25, premium: 200 },
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
