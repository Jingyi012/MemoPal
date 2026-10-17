import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { AvatarDefinitionDto, AvatarDefinitionUpsertRequest } from '../types/avatar';

export const adminAvatarsApi = {
  async list(pageNumber = 1, pageSize = 20, search = '') {
    const response = await apiClient.get<PaginatedResponse<AvatarDefinitionDto>>('/admin/avatars', {
      params: { pageNumber, pageSize, search: search || undefined },
    });
    return response.data;
  },
  async create(payload: AvatarDefinitionUpsertRequest) {
    const response = await apiClient.post<ApiResponse<AvatarDefinitionDto>>('/admin/avatars', payload);
    return response.data.data;
  },
  async update(id: string, payload: AvatarDefinitionUpsertRequest) {
    const response = await apiClient.put<ApiResponse<AvatarDefinitionDto>>(`/admin/avatars/${id}`, payload);
    return response.data.data;
  },
  async remove(id: string) {
    await apiClient.delete(`/admin/avatars/${id}`);
  },
};
