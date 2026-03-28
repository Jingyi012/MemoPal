import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Location } from '@/types/palace';
import { and, asc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

interface LocationRepository {
  getByPalace(palaceId: string): Promise<Location[]>;
  getById(id: string): Promise<Location | null>;
  save(location: Partial<Location>): Promise<string>;
  delete(id: string): Promise<void>;
  upsertMany(
    serverLocations: Location[],
    options?: { pruneMissingSynced?: boolean; palaceId?: string }
  ): Promise<void>;
}

export function createLocationRepository(): LocationRepository {
  const refreshPalaceLocationCount = async (tx: any, palaceId: string, now: string) => {
    const result = await tx
      .select({ count: sql<number>`count(*)` })
      .from(schema.locations)
      .where(and(eq(schema.locations.palaceId, palaceId), eq(schema.locations.isDeleted, false)));

    const count = result[0]?.count ?? 0;
    await tx
      .update(schema.palaces)
      .set({ locationsCount: count, updatedAt: now })
      .where(eq(schema.palaces.id, palaceId));
  };

  return {
    async getByPalace(palaceId: string): Promise<Location[]> {
      return (await db.query.locations.findMany({
        where: and(eq(schema.locations.palaceId, palaceId), eq(schema.locations.isDeleted, false)),
        orderBy: [asc(schema.locations.position)],
      })) as Location[];
    },

    async getById(id: string): Promise<Location | null> {
      return (await db.query.locations.findFirst({
        where: and(eq(schema.locations.id, id), eq(schema.locations.isDeleted, false)),
      })) as Location | null;
    },

    async save(location: Partial<Location>): Promise<string> {
      const requestedId = location.id;
      const id = requestedId || Crypto.randomUUID();
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        const existing = requestedId
          ? await tx.query.locations.findFirst({
              where: eq(schema.locations.id, requestedId),
            })
          : null;

        if (existing) {
          const merged: Partial<Location> = {
            ...(existing as Location),
            ...location,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: now,
            lastSyncedAt: null,
          };

          if (!merged.palaceId || !merged.name || !merged.description || !merged.imageUrl) {
            throw new Error('Location palaceId, name, description and imageUrl are required.');
          }

          await tx
            .update(schema.locations)
            .set({
              palaceId: merged.palaceId,
              position: merged.position ?? 0,
              name: merged.name,
              description: merged.description,
              imageUrl: merged.imageUrl,
              isDeleted: merged.isDeleted ?? false,
              deletedAt:
                Object.prototype.hasOwnProperty.call(merged, 'deletedAt')
                  ? (merged.deletedAt ?? null)
                  : existing.deletedAt,
              updatedAt: now,
              lastSyncedAt: null,
            })
            .where(eq(schema.locations.id, existing.id));

          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.LOCATION,
            entityId: existing.id,
            action: 'update',
            payload: { ...merged, id: existing.id, updatedAt: now, lastSyncedAt: null },
          });

          await refreshPalaceLocationCount(tx, merged.palaceId, now);
          return;
        }

        if (!location.palaceId || !location.name || !location.description || !location.imageUrl) {
          throw new Error('Location palaceId, name, description and imageUrl are required.');
        }

        const createPayload: Partial<Location> = {
          id,
          palaceId: location.palaceId,
          position: location.position ?? 0,
          name: location.name,
          description: location.description,
          imageUrl: location.imageUrl,
          createdAt: location.createdAt || now,
          updatedAt: now,
          lastSyncedAt: null,
          isDeleted: false,
          deletedAt: null,
        };

        await tx.insert(schema.locations).values({
          id,
          palaceId: createPayload.palaceId!,
          position: createPayload.position ?? 0,
          name: createPayload.name!,
          description: createPayload.description!,
          imageUrl: createPayload.imageUrl!,
          createdAt: createPayload.createdAt || now,
          updatedAt: now,
          lastSyncedAt: null,
          isDeleted: false,
          deletedAt: null,
        });

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LOCATION,
          entityId: id,
          action: 'create',
          payload: { ...createPayload, id },
        });

        await refreshPalaceLocationCount(tx, createPayload.palaceId!, now);
      });

      return id;
    },

    async delete(id: string): Promise<void> {
      await db.transaction(async (tx) => {
        const record = await tx.query.locations.findFirst({
          columns: { lastSyncedAt: true, palaceId: true },
          where: eq(schema.locations.id, id),
        });

        if (!record) return;

        if (record.lastSyncedAt) {
          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.LOCATION,
            entityId: id,
            action: 'delete',
          });
        } else {
          await SyncBase.removePendingSyncs(tx as any, id);
        }

        await tx
          .update(schema.locations)
          .set({ isDeleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
          .where(eq(schema.locations.id, id));

        if (record.palaceId) {
          await refreshPalaceLocationCount(tx, record.palaceId, new Date().toISOString());
        }
      });
    },

    async upsertMany(
      serverLocations: Location[],
      options?: { pruneMissingSynced?: boolean; palaceId?: string }
    ): Promise<void> {
      const ids = serverLocations.map((l) => l.id);
      const now = new Date().toISOString();
      const pruneMissingSynced = options?.pruneMissingSynced ?? false;
      const prunePalaceId = options?.palaceId;

      await db.transaction(async (tx) => {
        const localRecords =
          ids.length > 0
            ? await tx.query.locations.findMany({
                where: inArray(schema.locations.id, ids),
              })
            : [];
        const localMap = new Map(localRecords.map((r) => [r.id, r]));

        const dirtyIds =
          ids.length > 0
            ? await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.LOCATION)
            : new Set<string>();

        for (const serverItem of serverLocations) {
          const localItem = localMap.get(serverItem.id);
          const isDirty = dirtyIds.has(serverItem.id);

          if (!localItem) {
            await tx.insert(schema.locations).values({
              ...serverItem,
              lastSyncedAt: now,
              isDeleted: Boolean(serverItem.isDeleted),
            });
          } else if (isDirty) {
            continue;
          } else {
            const serverDate = new Date(serverItem.updatedAt).getTime();
            const localDate = new Date(localItem.updatedAt).getTime();

            if (serverDate > localDate) {
              await tx
                .insert(schema.locations)
                .values({ ...serverItem, lastSyncedAt: now })
                .onConflictDoUpdate({
                  target: schema.locations.id,
                  set: { ...serverItem, lastSyncedAt: now },
                });
            } else if (localDate > serverDate) {
              await SyncBase.addToQueue(tx as any, {
                entityType: EntityType.LOCATION,
                entityId: localItem.id,
                action: 'update',
                payload: { ...localItem },
              });
            }
          }
        }

        if (pruneMissingSynced && prunePalaceId) {
          const dirtyQueueRows = await tx.query.syncQueue.findMany({
            columns: { entityId: true },
            where: eq(schema.syncQueue.entityType, EntityType.LOCATION),
          });
          const dirtyLocationIds = new Set(dirtyQueueRows.map((row) => row.entityId));

          const syncedLocationsInPalace = await tx.query.locations.findMany({
            columns: { id: true },
            where: and(
              eq(schema.locations.palaceId, prunePalaceId),
              eq(schema.locations.isDeleted, false),
              isNotNull(schema.locations.lastSyncedAt)
            ),
          });

          const serverIdSet = new Set(ids);
          const staleIds = syncedLocationsInPalace
            .map((row) => row.id)
            .filter((id) => !serverIdSet.has(id) && !dirtyLocationIds.has(id));

          if (staleIds.length > 0) {
            await tx
              .update(schema.locations)
              .set({
                isDeleted: true,
                deletedAt: now,
                updatedAt: now,
                lastSyncedAt: now,
              })
              .where(inArray(schema.locations.id, staleIds));
          }

          await refreshPalaceLocationCount(tx, prunePalaceId, now);
        }

        const affectedPalaceIds = Array.from(
          new Set(serverLocations.map((location) => location.palaceId).filter(Boolean))
        ) as string[];
        for (const palaceId of affectedPalaceIds) {
          await refreshPalaceLocationCount(tx, palaceId, now);
        }
      });
    },
  };
}
