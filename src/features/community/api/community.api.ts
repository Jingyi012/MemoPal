import api from '@/core/api/apiClient';
import { CommunityLesson } from '@/features/community/types/community.types';
import { GeneralResponse, PaginationMeta, PagedResponse } from '@/core/types/general';
import { LessonCategory } from '@/features/palace';

type CommunityLessonsResponse = {
  items: CommunityLesson[];
  pagination: PaginationMeta;
};

export type CommunityLessonQuery = {
  search?: string;
  category?: LessonCategory | 'all';
  pageNumber?: number;
  pageSize?: number;
};

function normalizeCategory(category?: LessonCategory | 'all') {
  if (!category || category === 'all') return undefined;
  return category;
}

export const communityApi = {
  async getLessons(query: CommunityLessonQuery = {}): Promise<CommunityLessonsResponse> {
    const response = await api.get<PagedResponse<CommunityLesson[]>>('/community/lessons', {
      params: {
        search: query.search?.trim() || undefined,
        category: normalizeCategory(query.category),
        pageNumber: query.pageNumber ?? 1,
        pageSize: query.pageSize ?? 20,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message ?? 'Failed to load community lessons.');
    }

    return {
      items: response.data.data ?? [],
      pagination: response.data.pagination,
    };
  },

  async getMyLessons(query: CommunityLessonQuery = {}): Promise<CommunityLessonsResponse> {
    const response = await api.get<PagedResponse<CommunityLesson[]>>('/community/lessons/mine', {
      params: {
        search: query.search?.trim() || undefined,
        category: normalizeCategory(query.category),
        pageNumber: query.pageNumber ?? 1,
        pageSize: query.pageSize ?? 20,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message ?? 'Failed to load contributed lessons.');
    }

    return {
      items: response.data.data ?? [],
      pagination: response.data.pagination,
    };
  },

  async getLessonByShareCode(shareCode: string): Promise<CommunityLesson> {
    const normalizedShareCode = shareCode.trim();
    if (!normalizedShareCode) {
      throw new Error('Share code is required.');
    }

    const response = await api.get<GeneralResponse<CommunityLesson>>(
      `/community/lessons/by-code/${encodeURIComponent(normalizedShareCode)}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Failed to resolve share code.');
    }

    return response.data.data;
  },
};
