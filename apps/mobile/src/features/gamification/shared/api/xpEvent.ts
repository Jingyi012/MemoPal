import api from '@/core/api/apiClient';
import { SourceType } from '@/enums/sourceType';
import { GeneralResponse } from '@/core/types/general';

export interface XpEventPayload {
  id: string;
  sourceType: SourceType;
  sourceId?: string | null;
  xpAmount: number;
  clientEventId: string;
  createdAt?: string;
  updatedAt?: string;
  lastSyncedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export interface XpEventRecord extends XpEventPayload {
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  isDeleted: boolean;
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
  async create(event: XpEventPayload): Promise<XpEventRecord> {
    const response = await api.post<GeneralResponse<XpEventRecord>>('/xp-events', event);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
