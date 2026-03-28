import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { SystemSettingDto } from '@/types/systemSettings';

export const systemSettingsApi = {
  /**
   * Fetch all system settings from backend
   * Called on app startup and during manual refresh
   */
  async fetchAllSettings(): Promise<SystemSettingDto[]> {
    const response = await api.get<GeneralResponse<SystemSettingDto[]>>('/system-settings/all');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data || [];
  },

  /**
   * Fetch feature limits (user-specific or global)
   */
  async getFeatureLimits(): Promise<SystemSettingDto[]> {
    const response = await api.get<GeneralResponse<SystemSettingDto[]>>(
      '/system-settings/feature-limits'
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data || [];
  },

  async getXpConfigs(): Promise<SystemSettingDto | null> {
    const response = await api.get<GeneralResponse<SystemSettingDto>>(
      '/system-settings/xp-configs'
    );
    if (!response.data.success || !response.data.data) return null;
    return response.data.data;
  },

  async getLevelConfigs(): Promise<SystemSettingDto | null> {
    const response = await api.get<GeneralResponse<SystemSettingDto>>(
      '/system-settings/level-configs'
    );
    if (!response.data.success || !response.data.data) return null;
    return response.data.data;
  },

  async getGamificationMobileUiConfig(): Promise<SystemSettingDto | null> {
    const response = await api.get<GeneralResponse<SystemSettingDto>>(
      '/system-settings/gamification/mobile-ui-config'
    );
    if (!response.data.success || !response.data.data) return null;
    return response.data.data;
  },
};
