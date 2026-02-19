import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Palace, PalaceDetails } from '@/types/palace';
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

/**
 * PalaceRepository - Local database operations only.
 * Optimized for single-user cache (data wiped on logout).
 */
interface PalaceRepository {
  getAll(): Promise<Palace[]>;
  getUnlocked(): Promise<Palace[]>;
  getById(id: string): Promise<PalaceDetails | undefined>;
  unlockPalace(palaceId: string): Promise<void>;
  save(palace: Partial<Palace>): Promise<string>;
  delete(id: string): Promise<void>;
  upsertMany(serverPalaces: Palace[]): Promise<void>;
}

export function createPalaceRepository(): PalaceRepository {
  // Helper to apply server data to local SQLite
  const applyServerVersion = async (tx: any, item: Palace, syncTime: string): Promise<void> => {
    await tx
      .insert(schema.palaces)
      .values({
        ...item,
        lastSyncedAt: syncTime,
        // Ensure data types are consistent for SQLite
        isLocked: Boolean(item.isLocked),
        isPremium: Boolean(item.isPremium),
        isCustom: Boolean(item.isCustom),
        isDeleted: Boolean(item.isDeleted),
      })
      .onConflictDoUpdate({
        target: schema.palaces.id,
        set: { ...item, lastSyncedAt: syncTime },
      });
  };

  return {
    async getAll(): Promise<Palace[]> {
      return (await db.query.palaces.findMany({
        where: eq(schema.palaces.isDeleted, false),
        orderBy: [asc(schema.palaces.createdAt)],
      })) as Palace[];
    },

    /**
     * Replaces getAllByUser. Simply filters where unlockedAt is set.
     */
    async getUnlocked(): Promise<Palace[]> {
      return (await db.query.palaces.findMany({
        where: and(eq(schema.palaces.isDeleted, false), isNotNull(schema.palaces.unlockedAt)),
        orderBy: [asc(schema.palaces.unlockedAt)],
      })) as Palace[];
    },

    async getById(id: string): Promise<PalaceDetails | undefined> {
      return (await db.query.palaces.findFirst({
        where: and(eq(schema.palaces.id, id), eq(schema.palaces.isDeleted, false)),
        with: {
          locations: true,
        },
      })) as PalaceDetails | undefined;
    },

    /**
     * Simplified unlocking: Just update the column on the palace record.
     */
    async unlockPalace(palaceId: string): Promise<void> {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        await tx
          .update(schema.palaces)
          .set({
            unlockedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.palaces.id, palaceId));

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.PALACE,
          entityId: palaceId,
          action: 'update',
          payload: { id: palaceId, unlockedAt: now, updatedAt: now },
        });
      });
    },

    async save(palace: Partial<Palace>): Promise<string> {
      const isNew = !palace.id;
      const id = palace.id || Crypto.randomUUID();
      const now = new Date().toISOString();
      const action = isNew ? 'create' : 'update';

      await db.transaction(async (tx) => {
        await tx
          .insert(schema.palaces)
          .values({
            id,
            name: palace.name!,
            description: palace.description!,
            locationsCount: palace.locationsCount ?? 0,
            thumbnail: palace.thumbnail!,
            isLocked: palace.isLocked ?? false,
            isPremium: palace.isPremium ?? false,
            isCustom: palace.isCustom ?? false,
            unlockedAt: palace.unlockedAt || (palace.isCustom ? now : null),
            createdAt: palace.createdAt || now,
            updatedAt: now,
            lastSyncedAt: null,
            isDeleted: false,
          })
          .onConflictDoUpdate({
            target: schema.palaces.id,
            set: {
              name: palace.name,
              description: palace.description,
              locationsCount: palace.locationsCount,
              thumbnail: palace.thumbnail,
              isLocked: palace.isLocked,
              isPremium: palace.isPremium,
              unlockedAt: palace.unlockedAt,
              updatedAt: now,
            },
          });

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.PALACE,
          entityId: id,
          action,
          payload: { ...palace, id, updatedAt: now },
        });
      });

      return id;
    },

    async delete(id: string): Promise<void> {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        const record = await tx.query.palaces.findFirst({
          columns: { lastSyncedAt: true },
          where: eq(schema.palaces.id, id),
        });

        if (!record) return;

        await tx
          .update(schema.palaces)
          .set({
            isDeleted: true,
            deletedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.palaces.id, id));

        if (record.lastSyncedAt) {
          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.PALACE,
            entityId: id,
            action: 'delete',
          });
        } else {
          await SyncBase.removePendingSyncs(tx as any, id);
        }
      });
    },

    async upsertMany(serverPalaces: Palace[]): Promise<void> {
      if (serverPalaces.length === 0) return;

      const ids = serverPalaces.map((p) => p.id);
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        const localRecords = await tx.query.palaces.findMany({
          where: inArray(schema.palaces.id, ids),
        });
        const localMap = new Map(localRecords.map((r) => [r.id, r]));
        const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.PALACE);

        for (const serverItem of serverPalaces) {
          const localItem = localMap.get(serverItem.id);
          const isDirty = dirtyIds.has(serverItem.id);

          if (isDirty) continue;

          if (!localItem) {
            await applyServerVersion(tx, serverItem, now);
          } else {
            const serverDate = new Date(serverItem.updatedAt).getTime();
            const localDate = new Date(localItem.updatedAt).getTime();

            if (serverDate > localDate) {
              await applyServerVersion(tx, serverItem, now);
            } else if (localDate > serverDate) {
              await SyncBase.addToQueue(tx as any, {
                entityType: EntityType.PALACE,
                entityId: localItem.id,
                action: 'update',
                payload: { ...localItem },
              });
            }
          }
        }
      });
    },
  };
}
