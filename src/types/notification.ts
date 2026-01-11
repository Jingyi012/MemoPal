export type NotificationType =
  | 'review'
  | 'achievement'
  | 'streak'
  | 'level'
  | 'complete'
  | 'premium';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}
