import api from '@/core/api/apiClient';
import { GeneralResponse } from '@/core/types/general';

export interface XpEventRecord {
  id: string;
  sourceType: string;
  sourceId?: string | null;
  xpAmount: number;
  clientEventId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export const xpEventApi = {
  async getAll(recentDays?: number): Promise<XpEventRecord[]> {
    const response = await api.get<GeneralResponse<XpEventRecord[]>>('/xp-events', {
      params: recentDays && recentDays > 0 ? { recentDays } : {},
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
