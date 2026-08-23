import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { PalaceSceneDto, PalaceSceneUpsertRequest } from '../types/palaceScene';

export const adminPalaceScenesApi = {
  async list() {
    const response = await apiClient.get<ApiResponse<PalaceSceneDto[]>>('/admin/palace-scenes');
    return response.data.data ?? [];
  },
  async create(payload: PalaceSceneUpsertRequest) {
    const response = await apiClient.post<ApiResponse<PalaceSceneDto>>('/admin/palace-scenes', payload);
    return response.data.data;
  },
  async update(id: string, payload: PalaceSceneUpsertRequest) {
    const response = await apiClient.put<ApiResponse<PalaceSceneDto>>(`/admin/palace-scenes/${id}`, payload);
    return response.data.data;
  },
  async delete(id: string) {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/admin/palace-scenes/${id}`);
    return response.data.data;
  },
};
