import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { AvatarDefinition } from '../types/avatar';

export const avatarsApi = {
  async list(): Promise<AvatarDefinition[]> {
    const response = await api.get<GeneralResponse<AvatarDefinition[]>>('/avatars');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Failed to load avatars.');
    }
    return response.data.data;
  },
};
