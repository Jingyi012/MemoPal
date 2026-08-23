import {
  getCommunityLessonByShareCode,
  getCommunityLessons,
  getMyCommunityLessons,
  importCommunityLessonToPalace,
} from '@/features/community/services/community.service';
import { CommunityLesson } from '@/features/community/types/community.types';
import { LessonCategory } from '@/features/palace';
import { useMutation, useQuery } from '@tanstack/react-query';

export const COMMUNITY_KEYS = {
  all: ['community'] as const,
  lessons: (
    search: string,
    category: LessonCategory | 'all',
    pageNumber: number,
    pageSize: number
  ) => [...COMMUNITY_KEYS.all, 'lessons', search, category, pageNumber, pageSize] as const,
  mine: (search: string, category: LessonCategory | 'all', pageNumber: number, pageSize: number) =>
    [...COMMUNITY_KEYS.all, 'mine', search, category, pageNumber, pageSize] as const,
  byShareCode: (shareCode: string) => [...COMMUNITY_KEYS.all, 'shareCode', shareCode] as const,
};

export function useCommunityLessons(params: {
  search: string;
  category: LessonCategory | 'all';
  pageNumber?: number;
  pageSize?: number;
}) {
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 20;

  return useQuery({
    queryKey: COMMUNITY_KEYS.lessons(params.search, params.category, pageNumber, pageSize),
    queryFn: async () =>
      await getCommunityLessons({
        search: params.search,
        category: params.category,
        pageNumber,
        pageSize,
      }),
    staleTime: 1000 * 30,
  });
}

export function useMyCommunityLessons(params: {
  search?: string;
  category?: LessonCategory | 'all';
  pageNumber?: number;
  pageSize?: number;
}) {
  const search = params.search ?? '';
  const category = params.category ?? 'all';
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? 20;

  return useQuery({
    queryKey: COMMUNITY_KEYS.mine(search, category, pageNumber, pageSize),
    queryFn: async () =>
      await getMyCommunityLessons({
        search,
        category,
        pageNumber,
        pageSize,
      }),
    staleTime: 1000 * 30,
  });
}

export function useImportCommunityLesson() {
  return useMutation({
    mutationFn: async (params: { lesson: CommunityLesson; palaceId: string }) =>
      await importCommunityLessonToPalace(params),
  });
}

export function useCommunityLessonByShareCode() {
  return useMutation({
    mutationFn: async (shareCode: string) => await getCommunityLessonByShareCode(shareCode),
  });
}
