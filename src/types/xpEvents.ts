import { SourceType } from '@/enums/sourceType';

export interface XpEvents {
  id: string;
  sourceType: SourceType;
  sourceId?: string;
  xpAmount: number;
  clientEventId: number;
  createdAt: string;
}
