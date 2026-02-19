import * as badgeService from '@/services/badge.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * TanStack Query keys for badges
 * Organized by query type for fine-grained cache invalidation
 */
export const BADGE_KEYS = {
  all: ['badges'] as const,
  lists: () => [...BADGE_KEYS.all, 'list'] as const,
  list: () => [...BADGE_KEYS.lists()] as const,
  allBadges: () => [...BADGE_KEYS.all, 'all'] as const,
  detail: (id: string) => [...BADGE_KEYS.all, 'detail', id] as const,
  userBadges: (userId: string) => [...BADGE_KEYS.all, 'user', userId] as const,
};

/**
 * Hook: Fetch all available badges
 * Uses TanStack Query for caching and reactive updates
 * Automatically syncs with backend and merges with local data
 */
export function useAllBadges() {
  const query = useQuery({
    queryKey: BADGE_KEYS.allBadges(),
    queryFn: async () => {
      return await badgeService.getAllBadges();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });

  return {
    badges: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook: Fetch badge by ID
 * Uses TanStack Query for caching and reactive updates
 */
export function useBadgeById(badgeId: string) {
  const query = useQuery({
    queryKey: BADGE_KEYS.detail(badgeId),
    queryFn: async () => {
      return await badgeService.getBadgeById(badgeId);
    },
    enabled: !!badgeId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  return {
    badge: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook: Fetch user's earned badges
 * Uses TanStack Query for caching and reactive updates
 * Automatically syncs with backend
 */
export function useUserBadges(userId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: BADGE_KEYS.userBadges(userId),
    queryFn: async () => {
      return await badgeService.getUserBadges(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  return {
    userBadges: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook: Award a badge to user
 * Mutation that handles optimistic updates and cache invalidation
 */
export function useAwardBadge(userId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (badgeId: string) => {
      await badgeService.awardBadge(userId, badgeId);
    },
    onSuccess: () => {
      // Invalidate user badges query to trigger refetch
      queryClient.invalidateQueries({
        queryKey: BADGE_KEYS.userBadges(userId),
      });
      // Also invalidate all badges list if needed
      queryClient.invalidateQueries({
        queryKey: BADGE_KEYS.allBadges(),
      });
    },
    onError: (error) => {
      console.error('Failed to award badge:', error);
    },
  });

  return {
    awardBadge: mutation.mutate,
    awardBadgeAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
