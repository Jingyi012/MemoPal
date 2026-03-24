import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getFeatureLimits, getFeatureLimitsFallback } from '@/services/featureLimits.service';
import { useQuery } from '@tanstack/react-query';

export const FEATURE_LIMIT_KEYS = {
  all: ['feature-limits'] as const,
  current: (userId: string | undefined, isPremium: boolean) =>
    [...FEATURE_LIMIT_KEYS.all, userId ?? 'anonymous', isPremium ? 'premium' : 'free'] as const,
};

export function useFeatureLimits() {
  const { user } = useCurrentUser();
  const isPremium = Boolean(user?.isPremium);
  const fallback = getFeatureLimitsFallback(isPremium);

  const query = useQuery({
    queryKey: FEATURE_LIMIT_KEYS.current(user?.id, isPremium),
    enabled: !!user,
    queryFn: () => getFeatureLimits(user!.id, isPremium),
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
