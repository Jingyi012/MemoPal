import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityMemorySetApi } from '../api/communityMemorySet.api';
import { COMMUNITY_MEMORY_SET_KEYS, MEMORY_SET_KEYS } from '../queryKeys';
import type { CommunityMemorySetFilters } from '../types/communityMemorySet.types';

const PAGE_SIZE = 12;

export function useCommunityMemorySets(filters: CommunityMemorySetFilters) {
  const normalized = {
    search: filters.search?.trim() || undefined,
    techniqueKey: filters.techniqueKey,
    goalType: filters.goalType,
    sort: filters.sort ?? 'newest',
    bookmarkedOnly: filters.bookmarkedOnly ?? false,
  };

  return useInfiniteQuery({
    queryKey: COMMUNITY_MEMORY_SET_KEYS.discover({
      ...normalized,
      bookmarkedOnly: normalized.bookmarkedOnly ? 'true' : undefined,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => communityMemorySetApi.discover(normalized, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.pageNumber + 1;
      return lastPage.pageNumber * lastPage.pageSize < lastPage.totalCount ? nextPage : undefined;
    },
    staleTime: 1000 * 60 * 2,
    networkMode: 'online',
  });
}

export function useCommunityMemorySet(memorySetId: string) {
  return useQuery({
    queryKey: COMMUNITY_MEMORY_SET_KEYS.detail(memorySetId),
    queryFn: () => communityMemorySetApi.getPublicById(memorySetId),
    enabled: Boolean(memorySetId),
    staleTime: 1000 * 60 * 5,
    networkMode: 'online',
  });
}

export function useCopyCommunityMemorySet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memorySetId: string) => communityMemorySetApi.copy(memorySetId),
    retry: false,
    onSuccess: ({ memorySet }) => {
      queryClient.setQueryData(MEMORY_SET_KEYS.detail(memorySet.id), memorySet);
      void queryClient.invalidateQueries({ queryKey: MEMORY_SET_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_MEMORY_SET_KEYS.all });
    },
  });
}

export function useSetCommunityMemorySetHelpful() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memorySetId, isHelpful }: { memorySetId: string; isHelpful: boolean }) =>
      communityMemorySetApi.setHelpful(memorySetId, isHelpful),
    retry: false,
    onSuccess: ({ memorySetId }) => {
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_MEMORY_SET_KEYS.detail(memorySetId) });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_MEMORY_SET_KEYS.all });
    },
  });
}

export function useSetCommunityMemorySetBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memorySetId, isBookmarked }: { memorySetId: string; isBookmarked: boolean }) =>
      communityMemorySetApi.setBookmarked(memorySetId, isBookmarked),
    retry: false,
    onSuccess: ({ memorySetId }) => {
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_MEMORY_SET_KEYS.detail(memorySetId) });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_MEMORY_SET_KEYS.all });
    },
  });
}

export function useReportCommunityMemorySet() {
  return useMutation({
    mutationFn: ({ memorySetId, reason, details }: { memorySetId: string; reason: string; details?: string }) =>
      communityMemorySetApi.report(memorySetId, reason, details),
    retry: false,
  });
}
