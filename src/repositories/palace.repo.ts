import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Palace, PalaceDetails } from '@/types/palace';
import { and, asc, eq, inArray } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export function usePalaceRepository() {
  /**
   * Fetch all palaces
   * Note: This is now async to match Drizzle/SQLite behavior
   */
  const getAll = async (): Promise<Palace[]> => {
    return (await db.query.palaces.findMany({
      where: eq(schema.palaces.isDeleted, false),
      orderBy: [asc(schema.palaces.createdAt)],
    })) as Palace[];
  };

  /**
   * Fetch all palaces for a specific user (with unlocked status)
   */
  const getAllByUser = async (userId: string): Promise<(Palace & { isUnlocked: boolean })[]> => {
    const allPalaces = await getAll();

    // Get user's unlocked palaces
    const userPalaces = await db.query.userPalaces.findMany({
      where: eq(schema.userPalaces.userId, userId),
      columns: { palaceId: true },
    });

    const unlockedIds = new Set(userPalaces.map((up) => up.palaceId));

    return allPalaces.map((palace) => ({
      ...palace,
      isUnlocked: unlockedIds.has(palace.id),
    }));
  };

  /**
   * Fetch a single palace by ID with locations
   */
  const getById = async (id: string): Promise<PalaceDetails | undefined> => {
    return (await db.query.palaces.findFirst({
      where: and(eq(schema.palaces.id, id), eq(schema.palaces.isDeleted, false)),
      with: {
        locations: true,
      },
    })) as PalaceDetails | undefined;
  };

  /**
   * Check if user has unlocked a palace
   */
  const hasUserUnlockedPalace = async (userId: string, palaceId: string): Promise<boolean> => {
    const result = await db.query.userPalaces.findFirst({
      where: and(eq(schema.userPalaces.userId, userId), eq(schema.userPalaces.palaceId, palaceId)),
    });
    return !!result;
  };

  /**
   * Unlock a palace for a user
   */
  const unlockPalaceForUser = async (userId: string, palaceId: string) => {
    const now = new Date().toISOString();
    await db
      .insert(schema.userPalaces)
      .values({
        id: `${userId}-${palaceId}`,
        userId,
        palaceId,
        unlockedAt: now,
      })
      .onConflictDoNothing();
  };

  /**
   * Lock a palace for a user (remove access)
   */
  const lockPalaceForUser = async (userId: string, palaceId: string) => {
    await db
      .delete(schema.userPalaces)
      .where(and(eq(schema.userPalaces.userId, userId), eq(schema.userPalaces.palaceId, palaceId)));
  };

  /**
   * SAVE (Create or Update)
   * Uses a transaction to ensure atomic updates to data and sync queue
   */
  const save = async (palace: Partial<Palace>) => {
    const isNew = !palace.id;
    const id = palace.id || Crypto.randomUUID();
    const now = new Date().toISOString();
    const action = isNew ? 'create' : 'update';

    await db.transaction(async (tx) => {
      // 1. Upsert Local Palace
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
          createdAt: palace.createdAt || now,
          updatedAt: now,
          lastSyncedAt: palace.lastSyncedAt || null,
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
            updatedAt: now,
          },
        });

      // 2. Add to Sync Queue
      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.PALACE,
        entityId: id,
        action: action,
        payload: { ...palace, id, updatedAt: now },
      });
    });

    return id;
  };

  /**
   * REMOVE
   * Handles local cleanup and server deletion queuing
   */
  const remove = async (id: string) => {
    await db.transaction(async (tx) => {
      const record = await tx.query.palaces.findFirst({
        columns: { lastSyncedAt: true },
        where: eq(schema.palaces.id, id),
      });

      if (!record) return;

      if (record.lastSyncedAt) {
        // Exists on server: Queue delete
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.PALACE,
          entityId: id,
          action: 'delete',
        });
      } else {
        // Local only: Just clear pending syncs
        await SyncBase.removePendingSyncs(tx as any, id);
      }

      // Delete locally
      await tx.delete(schema.palaces).where(eq(schema.palaces.id, id));
    });
  };

  /**
   * Bulk syncing from server
   */
  const upsertMany = async (serverPalaces: Palace[]) => {
    if (serverPalaces.length === 0) return;

    const ids = serverPalaces.map((p) => p.id);

    await db.transaction(async (tx) => {
      // 1. Bulk fetch local records to check versions
      const localRecords = await tx.query.palaces.findMany({
        where: inArray(schema.palaces.id, ids),
      });
      const localMap = new Map(localRecords.map((r) => [r.id, r]));

      // 2. Bulk fetch dirty status
      const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.PALACE);

      const now = new Date().toISOString();

      for (const serverItem of serverPalaces) {
        const localItem = localMap.get(serverItem.id);
        const isDirty = dirtyIds.has(serverItem.id);

        if (!localItem) {
          // New from server
          await applyServerVersion(tx, serverItem, now);
        } else if (isDirty) {
          // Local has unsynced changes: Skip server update
          continue;
        } else {
          const serverDate = new Date(serverItem.updatedAt).getTime();
          const localDate = new Date(localItem.updatedAt).getTime();

          if (serverDate > localDate) {
            // Server is newer: Update local
            await applyServerVersion(tx, serverItem, now);
          } else if (localDate > serverDate) {
            // Local is newer but not dirty: Re-sync to server
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
  };

  /**
   * Internal helper using Drizzle's upsert capability
   */
  async function applyServerVersion(tx: any, item: Palace, syncTime: string) {
    await tx
      .insert(schema.palaces)
      .values({
        ...item,
        lastSyncedAt: syncTime,
        // Drizzle handles boolean conversion (0/1) automatically
        isLocked: Boolean(item.isLocked),
        isPremium: Boolean(item.isPremium),
        isCustom: Boolean(item.isCustom),
        isDeleted: Boolean(item.isDeleted),
      })
      .onConflictDoUpdate({
        target: schema.palaces.id,
        set: { ...item, lastSyncedAt: syncTime },
      });
  }

  return {
    getAll,
    getAllByUser,
    getById,
    hasUserUnlockedPalace,
    unlockPalaceForUser,
    lockPalaceForUser,
    save,
    remove,
    upsertMany,
  };
}
