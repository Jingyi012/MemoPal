import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Notification } from '@/types/notification';
import { and, desc, eq, lt } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

interface NotificationRepository {
  getAll(): Promise<Notification[]>;
  getAllUnread(): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  dismiss(notificationId: string): Promise<void>;
  delete(notificationId: string): Promise<void>;
  create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  deleteOldDismissed(daysOld?: number): Promise<void>;
  upsertMany(notifications: Notification[]): Promise<void>;
}

export function createNotificationRepository(): NotificationRepository {
  return {
    async getAll(): Promise<Notification[]> {
      return (await db.query.notifications.findMany({
        where: and(eq(schema.notifications.isDeleted, false)),
        orderBy: [desc(schema.notifications.createdAt)],
      })) as Notification[];
    },

    async getAllUnread(): Promise<Notification[]> {
      return (await db.query.notifications.findMany({
        where: and(
          eq(schema.notifications.isRead, false),
          eq(schema.notifications.isDismissed, false),
          eq(schema.notifications.isDeleted, false)
        ),
        orderBy: [desc(schema.notifications.createdAt)],
      })) as Notification[];
    },

    async markAsRead(notificationId: string): Promise<void> {
      const now = new Date().toISOString();
      await db.transaction(async (tx) => {
        await tx
          .update(schema.notifications)
          .set({ isRead: true, readAt: now, updatedAt: now })
          .where(
            and(
              eq(schema.notifications.id, notificationId),
              eq(schema.notifications.isDeleted, false)
            )
          );

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.NOTIFICATION,
          entityId: notificationId,
          action: 'update',
          payload: { isRead: true, readAt: now },
        });
      });
    },

    async dismiss(notificationId: string): Promise<void> {
      const now = new Date().toISOString();
      await db.transaction(async (tx) => {
        await tx
          .update(schema.notifications)
          .set({ isDismissed: true, updatedAt: now })
          .where(
            and(
              eq(schema.notifications.id, notificationId),
              eq(schema.notifications.isDeleted, false)
            )
          );

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.NOTIFICATION,
          entityId: notificationId,
          action: 'update',
          payload: { isDismissed: true, updatedAt: now },
        });
      });
    },

    async delete(notificationId: string): Promise<void> {
      await db.transaction(async (tx) => {
        const record = await tx.query.notifications.findFirst({
          columns: { lastSyncedAt: true },
          where: eq(schema.notifications.id, notificationId),
        });

        if (!record) return;

        const now = new Date().toISOString();

        if (record.lastSyncedAt) {
          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.NOTIFICATION,
            entityId: notificationId,
            action: 'delete',
          });
        } else {
          await SyncBase.removePendingSyncs(tx as any, notificationId);
        }

        await tx
          .update(schema.notifications)
          .set({ isDeleted: true, deletedAt: now, updatedAt: now })
          .where(eq(schema.notifications.id, notificationId));
      });
    },

    async create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
      const id = Crypto.randomUUID();
      const createdAt = new Date().toISOString();

      const newNotification: Notification = {
        id,
        createdAt,
        ...notification,
        isDeleted: false,
        deletedAt: null,
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
    },

    async deleteOldDismissed(daysOld: number = 30): Promise<void> {
      const cutoffTime = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
      await db
        .delete(schema.notifications)
        .where(
          and(
            eq(schema.notifications.isDismissed, true),
            eq(schema.notifications.isDeleted, true),
            lt(schema.notifications.deletedAt, cutoffTime)
          )
        );
    },

    async upsertMany(notifications: Notification[]): Promise<void> {
      if (notifications.length === 0) return;
      const now = new Date().toISOString();

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
              isDeleted: notification.isDeleted,
              deletedAt: notification.deletedAt,
              updatedAt: now,
              lastSyncedAt: now,
            },
          });
      }
    },
  };
}
