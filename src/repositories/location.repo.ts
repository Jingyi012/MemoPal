import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Location } from '@/types/palace';
import { and, asc, eq, inArray } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export function useLocationRepository() {
  /**
   * Fetch all locations for a palace
   */
  const getByPalace = async (palaceId: string): Promise<Location[]> => {
    return (await db.query.locations.findMany({
      where: and(eq(schema.locations.palaceId, palaceId), eq(schema.locations.isDeleted, false)),
      orderBy: [asc(schema.locations.position)],
    })) as Location[];
  };

  /**
   * Fetch a single location by ID
   */
  const getById = async (id: string): Promise<Location | undefined> => {
    return (await db.query.locations.findFirst({
      where: and(eq(schema.locations.id, id), eq(schema.locations.isDeleted, false)),
    })) as Location | undefined;
  };

  /**
   * SAVE (Create or Update)
   * Uses a transaction to ensure atomic updates to data and sync queue
   */
  const save = async (location: Partial<Location>) => {
    const isNew = !location.id;
    const id = location.id || Crypto.randomUUID();
    const now = new Date().toISOString();
    const action = isNew ? 'create' : 'update';

    await db.transaction(async (tx) => {
      // 1. Upsert Local Location
      await tx
        .insert(schema.locations)
        .values({
          id,
          palaceId: location.palaceId!,
          position: location.position ?? 0,
          name: location.name!,
          description: location.description!,
          imageUrl: location.imageUrl!,
          createdAt: location.createdAt || now,
          updatedAt: now,
          lastSyncedAt: location.lastSyncedAt || null,
          isDeleted: false,
        })
        .onConflictDoUpdate({
          target: schema.locations.id,
          set: {
            position: location.position,
            name: location.name,
            description: location.description,
            imageUrl: location.imageUrl,
            updatedAt: now,
          },
        });

      // 2. Add to Sync Queue
      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.LOCATION,
        entityId: id,
        action: action,
        payload: { ...location, id, updatedAt: now },
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
      const record = await tx.query.locations.findFirst({
        columns: { lastSyncedAt: true },
        where: eq(schema.locations.id, id),
      });

      if (!record) return;

      if (record.lastSyncedAt) {
        // Exists on server: Queue delete
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LOCATION,
          entityId: id,
          action: 'delete',
        });
      } else {
        // Local only: Just clear pending syncs
        await SyncBase.removePendingSyncs(tx as any, id);
      }

      // Delete locally
      await tx.delete(schema.locations).where(eq(schema.locations.id, id));
    });
  };

  /**
   * Bulk syncing from server
   */
  const upsertMany = async (serverLocations: Location[]) => {
    if (serverLocations.length === 0) return;

    const ids = serverLocations.map((l) => l.id);

    await db.transaction(async (tx) => {
      // 1. Bulk fetch local records to check versions
      const localRecords = await tx.query.locations.findMany({
        where: inArray(schema.locations.id, ids),
      });
      const localMap = new Map(localRecords.map((r) => [r.id, r]));

      // 2. Bulk fetch dirty status
      const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.LOCATION);

      const now = new Date().toISOString();

      for (const serverItem of serverLocations) {
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
              entityType: EntityType.LOCATION,
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
  async function applyServerVersion(tx: any, item: Location, syncTime: string) {
    await tx
      .insert(schema.locations)
      .values({
        ...item,
        lastSyncedAt: syncTime,
        isDeleted: Boolean(item.isDeleted),
      })
      .onConflictDoUpdate({
        target: schema.locations.id,
        set: { ...item, lastSyncedAt: syncTime },
      });
  }

  return { getByPalace, getById, save, remove, upsertMany };
}
