import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { MissionDashboard } from '@/types/missions';

export const missionApi = {
  async getCurrent(): Promise<MissionDashboard> {
    const response = await api.get<GeneralResponse<MissionDashboard>>('/missions/current');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
