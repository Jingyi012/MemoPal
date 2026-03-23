import { FeatureLimits, userStatsApi } from '@/api/userStats';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_FREE_LIMITS: FeatureLimits = {
  isPremium: false,
  customPalaces: 0,
  customLessonsPerPalace: 5,
  customLocationsPerPalace: 15,
  customWordsPerLesson: 25,
};

const DEFAULT_PREMIUM_LIMITS: FeatureLimits = {
  isPremium: true,
  customPalaces: 20,
  customLessonsPerPalace: 50,
  customLocationsPerPalace: 100,
  customWordsPerLesson: 200,
};

export const FEATURE_LIMIT_KEYS = {
  all: ['feature-limits'] as const,
  current: (userId: string | undefined, isPremium: boolean) =>
    [...FEATURE_LIMIT_KEYS.all, userId ?? 'anonymous', isPremium ? 'premium' : 'free'] as const,
};

function getLocalFallback(isPremium: boolean): FeatureLimits {
  return isPremium ? DEFAULT_PREMIUM_LIMITS : DEFAULT_FREE_LIMITS;
}

export function useFeatureLimits() {
  const { user } = useCurrentUser();
  const isPremium = Boolean(user?.isPremium);
  const fallback = getLocalFallback(isPremium);

  const query = useQuery({
    queryKey: FEATURE_LIMIT_KEYS.current(user?.id, isPremium),
    enabled: !!user,
    queryFn: async () => {
      try {
        return await userStatsApi.getFeatureLimits();
      } catch (error) {
        console.warn('Failed to fetch feature limits, using local fallback:', error);
        return fallback;
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return {
    limits: query.data ?? fallback,
    isLoading: query.isLoading && !query.data,
    isError: query.isError,
    refetch: query.refetch,
  };
}
