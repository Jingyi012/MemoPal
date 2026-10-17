import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { AppearanceDefinition } from '../types/appearance';

export const appearanceApi = {
  async list(): Promise<AppearanceDefinition[]> {
    const response = await api.get<GeneralResponse<AppearanceDefinition[]>>('/appearance-items');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Failed to load appearance items.');
    }
    return response.data.data;
  },
};
