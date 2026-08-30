import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { PredefinedMemoryLessonCategoryDto, PredefinedMemoryLessonCategoryUpsertRequest, PredefinedMemoryLessonDto, PredefinedMemoryLessonUpsertRequest } from '../types/predefinedMemoryLesson';

const endpoint = '/admin/predefined-memory-lessons';

export const adminPredefinedMemoryLessonsApi = {
  async list() {
    const response = await apiClient.get<ApiResponse<PredefinedMemoryLessonDto[]>>(endpoint);
    return response.data.data ?? [];
  },
  async create(payload: PredefinedMemoryLessonUpsertRequest) {
    const response = await apiClient.post<ApiResponse<PredefinedMemoryLessonDto>>(endpoint, payload);
    return response.data.data;
  },
  async update(id: string, payload: PredefinedMemoryLessonUpsertRequest) {
    const response = await apiClient.put<ApiResponse<PredefinedMemoryLessonDto>>(`${endpoint}/${id}`, payload);
    return response.data.data;
  },
  async delete(id: string) {
    const response = await apiClient.delete<ApiResponse<boolean>>(`${endpoint}/${id}`);
    return response.data.data;
  },
};

const categoryEndpoint = '/admin/predefined-memory-lesson-categories';

export const adminPredefinedMemoryLessonCategoriesApi = {
  async list() {
    const response = await apiClient.get<ApiResponse<PredefinedMemoryLessonCategoryDto[]>>(categoryEndpoint);
    return response.data.data ?? [];
  },
  async create(payload: PredefinedMemoryLessonCategoryUpsertRequest) {
    const response = await apiClient.post<ApiResponse<PredefinedMemoryLessonCategoryDto>>(categoryEndpoint, payload);
    return response.data.data;
  },
  async update(id: string, payload: PredefinedMemoryLessonCategoryUpsertRequest) {
    const response = await apiClient.put<ApiResponse<PredefinedMemoryLessonCategoryDto>>(`${categoryEndpoint}/${id}`, payload);
    return response.data.data;
  },
  async delete(id: string) {
    const response = await apiClient.delete<ApiResponse<boolean>>(`${categoryEndpoint}/${id}`);
    return response.data.data;
  },
};
