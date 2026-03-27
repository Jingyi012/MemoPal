import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { GamificationMobileUiConfig, MissionDashboard } from '@/types/missions';

export const missionApi = {
  async getCurrent(): Promise<MissionDashboard> {
    const response = await api.get<GeneralResponse<MissionDashboard>>('/missions/current');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getMobileUiConfig(): Promise<GamificationMobileUiConfig> {
    const response = await api.get<GeneralResponse<GamificationMobileUiConfig>>(
      '/system-settings/gamification/mobile-ui-config'
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
