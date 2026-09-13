import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { PredefinedMemoryLesson } from '../types/predefinedMemoryLesson.types';

export interface MemoryCollection {
  id: string;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  emoji: string;
  categoryId: string;
  isPublished: boolean;
  sortOrder: number;
  version: number;
  lessons: PredefinedMemoryLesson[];
}

export const memoryCollectionsApi = {
  async list(): Promise<MemoryCollection[]> {
    const response = await api.get<GeneralResponse<MemoryCollection[]>>('/v1/memory-collections');
    if (!response.data.success) throw new Error(response.data.message ?? 'Could not load collections.');
    return response.data.data;
  },
  async download(id: string, language: 'en' | 'zh') {
    const response = await api.post<GeneralResponse<{ folderId: string; memorySetCount: number; alreadyDownloaded: boolean }>>(
      `/v1/memory-collections/${encodeURIComponent(id)}/download`, { language });
    if (!response.data.success) throw new Error(response.data.message ?? 'Could not download collection.');
    return response.data.data;
  },
};
