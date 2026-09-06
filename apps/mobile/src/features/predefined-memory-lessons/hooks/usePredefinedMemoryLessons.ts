import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { predefinedMemoryLessonsApi } from '../api/predefinedMemoryLessons.api';

export const PREDEFINED_MEMORY_LESSON_KEYS = {
  all: ['predefined-memory-lessons', 'v1'] as const,
  published: () => [...PREDEFINED_MEMORY_LESSON_KEYS.all, 'published'] as const,
};

export function usePredefinedMemoryLessons() {
  return useQuery({
    queryKey: PREDEFINED_MEMORY_LESSON_KEYS.published(),
    queryFn: () => predefinedMemoryLessonsApi.getPublished(),
    staleTime: 1000 * 60 * 10,
    networkMode: 'online',
  });
}

export function useInfinitePredefinedMemoryLessons() {
  return useInfiniteQuery({
    queryKey: [...PREDEFINED_MEMORY_LESSON_KEYS.published(), 'paged'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => predefinedMemoryLessonsApi.getPublishedPage(pageParam, 12),
    getNextPageParam: (lastPage) => lastPage.pageNumber * lastPage.pageSize < lastPage.totalCount ? lastPage.pageNumber + 1 : undefined,
    staleTime: 1000 * 60 * 10,
    networkMode: 'online',
  });
}
