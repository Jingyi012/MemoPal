import { NotificationType } from '@/enums/notificationType';
import { Auditable, SoftDeletable, Syncable } from './general';

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

export interface NotificationUpsertRequest {
  id?: string;
  type?: string;
  title?: string;
  body?: string;
  referenceType?: string;
  referenceId?: string;
  isRead?: boolean;
  isDismissed?: boolean;
  readAt?: string;
  scope?: 'all';
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
}
