import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { XpConfig } from '@/types/xpConfigs';

/**
 * API calls for XP configurations - organized by entity
 */
export const xpConfigApi = {
  /**
   * Get all XP configurations
   */
  async getAll(): Promise<XpConfig[]> {
    const response = await api.get<GeneralResponse<XpConfig[]>>('/xp-configs');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get XP config for a specific source type
   */
  async getBySourceType(sourceType: string): Promise<XpConfig> {
    const response = await api.get<GeneralResponse<XpConfig>>(`/xp-configs/${sourceType}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Create XP configuration
   */
  async create(config: Partial<XpConfig>): Promise<XpConfig> {
    const response = await api.post<GeneralResponse<XpConfig>>('/xp-configs', config);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update XP configuration
   */
  async update(id: string, config: Partial<XpConfig>): Promise<XpConfig> {
    const response = await api.patch<GeneralResponse<XpConfig>>(`/xp-configs/${id}`, config);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Delete XP configuration
   */
  async delete(id: string): Promise<boolean> {
    const response = await api.delete<GeneralResponse<null>>(`/xp-configs/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  },

};
