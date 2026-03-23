import { Auditable, SoftDeletable, Syncable } from './general';
import { SourceType } from '@/enums/sourceType';

export interface XpEvents extends Auditable, Syncable, SoftDeletable {
  id: string;
  sourceType: SourceType;
  sourceId?: string;
  xpAmount: number;
  clientEventId: string;
}
