import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { PredefinedMemoryLesson } from '../types/predefinedMemoryLesson.types';

export const predefinedMemoryLessonsApi = {
  async getPublished(): Promise<PredefinedMemoryLesson[]> {
    const response = await api.get<GeneralResponse<PredefinedMemoryLesson[]>>('/predefined-memory-lessons');
    if (!response.data.success) {
      throw new Error(response.data.message ?? 'Could not load lessons.');
    }
    return response.data.data ?? [];
  },
};
