import { Auditable, SoftDeletable, Syncable } from './general';

export type NotificationType = 'xp' | 'level_up' | 'milestone' | 'badge' | 'lesson' | 'system';

export interface Notification extends Auditable, SoftDeletable, Syncable {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  isDismissed: boolean;
  readAt?: string;
}
