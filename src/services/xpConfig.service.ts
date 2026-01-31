import { GeneralResponse } from '@/types/general';
import api from './api';

export interface XpConfig {
  id: string;
  sourceType: string;
  baseXp: number;
  multiplier: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class XpConfigService {
  /**
   * Get all XP configurations
   */
  static async getXpConfigs(): Promise<XpConfig[]> {
    const response = await api.get<GeneralResponse<XpConfig[]>>('/xp-configs');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Get XP config for a specific source type
   */
  static async getXpConfigBySourceType(sourceType: string): Promise<XpConfig> {
    const response = await api.get<GeneralResponse<XpConfig>>(`/xp-configs/${sourceType}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Create XP configuration
   */
  static async createXpConfig(config: Partial<XpConfig>): Promise<XpConfig> {
    const response = await api.post<GeneralResponse<XpConfig>>('/xp-configs', config);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Update XP configuration
   */
  static async updateXpConfig(id: string, config: Partial<XpConfig>): Promise<XpConfig> {
    const response = await api.patch<GeneralResponse<XpConfig>>(`/xp-configs/${id}`, config);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Delete XP configuration
   */
  static async deleteXpConfig(id: string): Promise<boolean> {
    const response = await api.delete<GeneralResponse<null>>(`/xp-configs/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  }
}
