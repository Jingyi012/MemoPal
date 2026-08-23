import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { PalaceScene } from '../types/palaceScene.types';

export const palaceSceneApi = {
  async getAll(): Promise<PalaceScene[]> {
    const response = await api.get<GeneralResponse<PalaceScene[]>>('/v2/palace-scenes');
    if (!response.data.success) throw new Error(response.data.message ?? 'Could not load Palace scenes.');
    return response.data.data ?? [];
  },
  async getById(sceneId: string): Promise<PalaceScene> {
    const response = await api.get<GeneralResponse<PalaceScene>>(
      `/v2/palace-scenes/${encodeURIComponent(sceneId)}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Could not load this Palace scene.');
    }
    return response.data.data;
  },
};
