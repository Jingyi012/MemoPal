import api from '@/core/api/apiClient';
import { GeneralResponse } from '@/core/types/general';
import { SystemSettingDto } from '@/core/settings/types/systemSettings';

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
  async getFeatureLimits(): Promise<SystemSettingDto | null> {
    const response = await api.get<GeneralResponse<SystemSettingDto>>(
      '/system-settings/feature-limits'
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

  async getNumberPegDefinitions(): Promise<SystemSettingDto | null> {
    const response = await api.get<GeneralResponse<SystemSettingDto>>(
      '/system-settings/number-peg-definitions'
    );
    if (!response.data.success || !response.data.data) return null;
    return response.data.data;
  },

  async getHelpFaqConfig(): Promise<SystemSettingDto | null> {
    const response = await api.get<GeneralResponse<SystemSettingDto>>('/system-settings/help-faq');
    if (!response.data.success || !response.data.data) return null;
    return response.data.data;
  },

  async getPrivacyPolicyConfig(): Promise<SystemSettingDto | null> {
    const response = await api.get<GeneralResponse<SystemSettingDto>>(
      '/system-settings/privacy-policy'
    );
    if (!response.data.success || !response.data.data) return null;
    return response.data.data;
  },

  async getPremiumSubscriptionConfig(): Promise<SystemSettingDto | null> {
    const response = await api.get<GeneralResponse<SystemSettingDto>>(
      '/system-settings/premium-subscription'
    );
    if (!response.data.success || !response.data.data) return null;
    return response.data.data;
  },
};
