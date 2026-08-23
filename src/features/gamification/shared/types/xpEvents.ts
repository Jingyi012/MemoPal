import { Auditable, SoftDeletable, Syncable } from '@/core/types/general';
import { SourceType } from '@/enums/sourceType';

export interface XpEvents extends Auditable, Syncable, SoftDeletable {
  id: string;
  sourceType: SourceType;
  sourceId?: string | null;
  xpAmount: number;
  clientEventId: string;
}
