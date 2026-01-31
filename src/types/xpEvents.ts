import { SourceType } from './xpConfigs';

export interface XpEvents {
  id: string;
  userId: string;
  sourceType: SourceType;
  sourceId?: string;
  xpAmount: number;
  clientEventId: number;
  createdAt: string;
}
