import api from '@/core/api/apiClient';
import { GeneralResponse } from '@/core/types/general';
import { MissionDashboard } from '@/features/gamification/shared/types/missions';

export const missionApi = {
  async getCurrent(): Promise<MissionDashboard> {
    const response = await api.get<GeneralResponse<MissionDashboard>>('/missions/current');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
