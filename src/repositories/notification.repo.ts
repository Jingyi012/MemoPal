import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Notification } from '@/types/notification';
import { and, desc, eq, lt } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export function useNotificationRepository() {
  /**
   * Fetch all notifications for a user, sorted by most recent
   */
  const getByUserId = async (userId: string): Promise<Notification[]> => {
    return (await db.query.notifications.findMany({
      where: eq(schema.notifications.userId, userId),
      orderBy: [desc(schema.notifications.createdAt)],
    })) as Notification[];
  };

  /**
   * Fetch unread notifications for a user
   */
  const getUnreadByUserId = async (userId: string): Promise<Notification[]> => {
    return (await db.query.notifications.findMany({
      where: and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false),
        eq(schema.notifications.isDismissed, false)
      ),
      orderBy: [desc(schema.notifications.createdAt)],
    })) as Notification[];
  };

  /**
   * Mark a notification as read
   */
  const markAsRead = async (notificationId: string): Promise<void> => {
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx
        .update(schema.notifications)
        .set({ isRead: true, readAt: now })
        .where(eq(schema.notifications.id, notificationId));

      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.NOTIFICATION,
        entityId: notificationId,
        action: 'update',
        payload: { isRead: true, readAt: now },
      });
    });
  };

  /**
   * Dismiss a notification
   */
  const dismiss = async (notificationId: string): Promise<void> => {
    await db.transaction(async (tx) => {
      await tx
        .update(schema.notifications)
        .set({ isDismissed: true })
        .where(eq(schema.notifications.id, notificationId));

      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.NOTIFICATION,
        entityId: notificationId,
        action: 'update',
        payload: { isDismissed: true },
      });
    });
  };

  /**
   * Create a new notification
   */
  const create = async (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> => {
    const id = Crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const newNotification: Notification = {
      id,
      createdAt,
      ...notification,
    };

    await db.transaction(async (tx) => {
      await tx.insert(schema.notifications).values(newNotification);

      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.NOTIFICATION,
        entityId: id,
        action: 'create',
        payload: newNotification,
      });
    });

    return newNotification;
  };

  /**
   * Delete old dismissed notifications (cleanup)
   */
  const deleteOldDismissed = async (daysOld: number = 30): Promise<void> => {
    const cutoffTime = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
    await db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.isDismissed, true),
          lt(schema.notifications.createdAt, cutoffTime)
        )
      );
  };

  /**
   * Upsert notifications from server
   */
  const upsertMany = async (notifications: Notification[]) => {
    if (notifications.length === 0) return;

    for (const notification of notifications) {
      await db
        .insert(schema.notifications)
        .values(notification)
        .onConflictDoUpdate({
          target: schema.notifications.id,
          set: {
            isRead: notification.isRead,
            isDismissed: notification.isDismissed,
            readAt: notification.readAt,
            updatedAt: new Date().toISOString(),
          },
        });
    }
  };

  return {
    getByUserId,
    getUnreadByUserId,
    markAsRead,
    dismiss,
    create,
    deleteOldDismissed,
    upsertMany,
  };
}
