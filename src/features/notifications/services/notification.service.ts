import { notificationApi } from '@/features/notifications/api/notification';
import { NotificationType } from '@/enums/notificationType';
import { createNotificationRepository } from '@/features/notifications/repositories/notification.repo';
import { Notification } from '@/features/notifications/types/notification';
import * as Crypto from 'expo-crypto';

const repo = createNotificationRepository();

export const InAppNotificationService = {
  /**
   * Syncs with server and returns all notifications
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      const remote = await notificationApi.getAll();
      if (remote?.length > 0) {
        await repo.upsertMany(remote);
      }
    } catch (error) {
      console.warn('[NotificationService] Fetch failed, using local:', error);
    }
    return await repo.getAll();
  },

  /**
   * Specialized fetch for unread items
   */
  async getUnreadCount(): Promise<number> {
    const unread = await repo.getAllUnread();
    return unread.length;
  },

  /**
   * Local actions that trigger the Sync Queue
   */
  async markAsRead(id: string): Promise<void> {
    await repo.markAsRead(id);
  },

  async markAllAsRead(): Promise<void> {
    await repo.markAllAsRead();
  },

  async dismiss(id: string): Promise<void> {
    await repo.dismiss(id);
  },

  async restore(id: string): Promise<void> {
    await repo.restore(id);
  },

  /**
   * Create a notification record (e.g., when a review is due)
   */
  async createInAppNotification(params: {
    type: NotificationType;
    title: string;
    body: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<Notification> {
    const now = new Date().toISOString();
    const newNotification: Notification = {
      id: Crypto.randomUUID(),
      ...params,
      isRead: false,
      isDismissed: false,
      createdAt: now,
      updatedAt: now,
    };

    return await repo.create(newNotification);
  },

  async cleanup(): Promise<void> {
    await repo.deleteOldDismissed(30);
  },
};
