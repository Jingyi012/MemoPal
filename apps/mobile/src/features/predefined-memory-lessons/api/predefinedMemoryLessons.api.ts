import api from '@/core/api/apiClient';
import type { PagedResponse } from '@/core/types/general';
import type { PredefinedMemoryLesson } from '../types/predefinedMemoryLesson.types';

export const predefinedMemoryLessonsApi = {
  async getPublishedPage(pageNumber = 1, pageSize = 12): Promise<{ items: PredefinedMemoryLesson[]; pageNumber: number; pageSize: number; totalCount: number }> {
    const response = await api.get<PagedResponse<PredefinedMemoryLesson[]>>('/v1/predefined-memory-lessons', { params: { pageNumber, pageSize } });
    if (!response.data.success) {
      throw new Error(response.data.message ?? 'Could not load lessons.');
    }
    return { items: response.data.data ?? [], pageNumber: response.data.pagination.pageNumber, pageSize: response.data.pagination.pageSize, totalCount: response.data.pagination.totalCount };
  },
  async getPublished(): Promise<PredefinedMemoryLesson[]> {
    const page = await this.getPublishedPage(1, 50);
    return page.items;
  },
};
