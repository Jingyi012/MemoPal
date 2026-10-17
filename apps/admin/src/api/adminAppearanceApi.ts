import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { AppearanceDefinitionDto, AppearanceDefinitionUpsertRequest } from '../types/appearance';

export const adminAppearanceApi = {
  async list(pageNumber = 1, pageSize = 20, search = '') {
    const response = await apiClient.get<PaginatedResponse<AppearanceDefinitionDto>>('/admin/appearance-items', {
      params: { pageNumber, pageSize, search: search || undefined },
    });
    return response.data;
  },
  async create(payload: AppearanceDefinitionUpsertRequest) {
    const response = await apiClient.post<ApiResponse<AppearanceDefinitionDto>>('/admin/appearance-items', payload);
    return response.data.data;
  },
  async update(id: string, payload: AppearanceDefinitionUpsertRequest) {
    const response = await apiClient.put<ApiResponse<AppearanceDefinitionDto>>(`/admin/appearance-items/${id}`, payload);
    return response.data.data;
  },
  async remove(id: string) {
    await apiClient.delete(`/admin/appearance-items/${id}`);
  },
};
