import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { PalaceScene, PalaceSceneUpsertRequest } from '../types/palaceScene.types';

export const palaceSceneApi = {
  async getAll(): Promise<PalaceScene[]> {
    const response = await api.get<GeneralResponse<PalaceScene[]>>('/v1/palace-scenes');
    if (!response.data.success) throw new Error(response.data.message ?? 'Could not load Palace scenes.');
    return response.data.data ?? [];
  },
  async getById(sceneId: string): Promise<PalaceScene> {
    const response = await api.get<GeneralResponse<PalaceScene>>(
      `/v1/palace-scenes/${encodeURIComponent(sceneId)}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Could not load this Palace scene.');
    }
    return response.data.data;
  },
  async createCustom(request: PalaceSceneUpsertRequest): Promise<PalaceScene> {
    const response = await api.post<GeneralResponse<PalaceScene>>('/v1/palace-scenes', request);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Could not save your custom Palace.');
    }
    return response.data.data;
  },
  async updateCustom(sceneId: string, request: PalaceSceneUpsertRequest): Promise<PalaceScene> {
    const response = await api.put<GeneralResponse<PalaceScene>>(
      `/v1/palace-scenes/${encodeURIComponent(sceneId)}`,
      request,
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Could not update your custom Palace.');
    }
    return response.data.data;
  },
  async deleteCustom(sceneId: string): Promise<boolean> {
    const response = await api.delete<GeneralResponse<boolean>>(
      `/v1/palace-scenes/${encodeURIComponent(sceneId)}`,
    );
    if (!response.data.success) {
      throw new Error(response.data.message ?? 'Could not delete your custom Palace.');
    }
    return response.data.data ?? false;
  },
};
