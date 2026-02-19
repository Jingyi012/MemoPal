import { notificationApi } from '@/api/notification';
import { createNotificationRepository } from '@/repositories/notification.repo';
import { Notification } from '@/types/notification';

const repo = createNotificationRepository();

export async function getNotifications(): Promise<Notification[]> {
  try {
    const remote = await notificationApi.getAll();
    if (remote && remote.length > 0) {
      await repo.upsertMany(remote);
    }
  } catch (error) {
    console.warn('Failed to sync notifications from backend, using local data:', error);
  }

  return await repo.getAll();
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  try {
    const remote = await notificationApi.getAllUnread();
    if (remote && remote.length > 0) {
      await repo.upsertMany(remote);
    }
  } catch (error) {
    console.warn('Failed to sync unread notifications, using local data:', error);
  }

  return await repo.getAllUnread();
}

export async function markAsRead(notificationId: string): Promise<void> {
  await repo.markAsRead(notificationId);
}

export async function dismissNotification(notificationId: string): Promise<void> {
  await repo.dismiss(notificationId);
}

export async function createNotification(
  notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<Notification> {
  return await repo.create(notification);
}

export async function cleanupOldDismissed(daysOld: number = 30): Promise<void> {
  await repo.deleteOldDismissed(daysOld);
}

export async function syncPendingChanges(): Promise<void> {
  try {
    // Notification sync handled by SyncBase queue
    console.log('Notification sync queue handled by SyncBase');
  } catch (error) {
    console.error('Notification sync error:', error);
  }
}
