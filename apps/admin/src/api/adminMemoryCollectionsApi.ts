import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { PredefinedMemoryLessonDto } from '../types/predefinedMemoryLesson';

export interface MemoryCollectionInput {
  titleEn: string; titleZh: string; descriptionEn: string; descriptionZh: string;
  emoji: string; categoryId: string; isPublished: boolean; sortOrder: number;
  expectedVersion?: number; lessonIds: string[];
}
export interface MemoryCollectionDto extends Omit<MemoryCollectionInput, 'lessonIds' | 'expectedVersion'> {
  id: string; version: number; lessons: PredefinedMemoryLessonDto[];
}
const endpoint = '/admin/memory-collections';
export interface MoveCollectionLessonInput {
  sourceCollectionId: string | null;
  targetCollectionId: string | null;
  expectedSourceVersion?: number;
  expectedTargetVersion?: number;
  expectedLessonVersion: number;
}
export const adminMemoryCollectionsApi = {
  async moveLesson(lessonId: string, input: MoveCollectionLessonInput) {
    return (await apiClient.post<ApiResponse<boolean>>(`${endpoint}/lessons/${lessonId}/move`, input)).data.data;
  },
  async delete(id: string, expectedVersion: number) {
    return (await apiClient.delete<ApiResponse<boolean>>(`${endpoint}/${id}`, { params: { expectedVersion } })).data.data;
  },
  async list() { return (await apiClient.get<ApiResponse<MemoryCollectionDto[]>>(endpoint)).data.data ?? []; },
  async save(id: string | undefined, input: MemoryCollectionInput) {
    const response = id ? await apiClient.put<ApiResponse<MemoryCollectionDto>>(`${endpoint}/${id}`, input)
      : await apiClient.post<ApiResponse<MemoryCollectionDto>>(endpoint, input);
    return response.data.data;
  },
};
