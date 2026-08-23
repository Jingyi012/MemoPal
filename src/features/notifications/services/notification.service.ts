import { notificationApi } from '@/features/notifications/api/notification';
import type { Notification } from '@/features/notifications/types/notification';
import type { NotificationType } from '@/enums/notificationType';
import * as Crypto from 'expo-crypto';

export const InAppNotificationService = {
  async getNotifications(): Promise<Notification[]> {
    return (await notificationApi.getAll()) ?? [];
  },

  async getUnreadCount(): Promise<number> {
    return ((await notificationApi.getAllUnread()) ?? []).length;
  },

  async markAsRead(id: string): Promise<void> {
    await notificationApi.update(id, { isRead: true, readAt: new Date().toISOString() });
  },

  async markAllAsRead(): Promise<void> {
    const unread = (await notificationApi.getAllUnread()) ?? [];
    const readAt = new Date().toISOString();
    await Promise.all(
      unread.map((notification) =>
        notificationApi.update(notification.id, { isRead: true, readAt })
      )
    );
  },

  async dismiss(id: string): Promise<void> {
    await notificationApi.update(id, { isDismissed: true });
  },

  async restore(id: string): Promise<void> {
    await notificationApi.update(id, { isDismissed: false });
  },

  async createInAppNotification(params: {
    type: NotificationType;
    title: string;
    body: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<Notification> {
    const now = new Date().toISOString();
    return notificationApi.create({
      id: Crypto.randomUUID(),
      ...params,
      isRead: false,
      isDismissed: false,
      createdAt: now,
      updatedAt: now,
    });
  },

  async cleanup(): Promise<void> {
    // Retention is server-owned in the online-first architecture.
  },
};
