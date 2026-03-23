import api from '@/api/api';
import { SourceType } from '@/enums/sourceType';
import { GeneralResponse } from '@/types/general';

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
  isDeleted: boolean;
}

export const xpEventApi = {
  async create(event: XpEventPayload): Promise<XpEventRecord> {
    const response = await api.post<GeneralResponse<XpEventRecord>>('/xp-events', event);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
