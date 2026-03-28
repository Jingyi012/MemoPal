import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Location } from '@/types/palace';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

interface LocationRepository {
  getByPalace(palaceId: string): Promise<Location[]>;
  getById(id: string): Promise<Location | null>;
  save(location: Partial<Location>): Promise<string>;
  delete(id: string): Promise<void>;
  upsertMany(serverLocations: Location[]): Promise<void>;
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
      const inputId = location.id;
      const id = inputId || Crypto.randomUUID();
      const now = new Date().toISOString();
      let action: 'create' | 'update' = 'create';

      await db.transaction(async (tx) => {
        if (inputId) {
          const existing = await tx.query.locations.findFirst({
            columns: { id: true },
            where: eq(schema.locations.id, inputId),
          });
          action = existing ? 'update' : 'create';
        }

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

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LOCATION,
          entityId: id,
          action: action,
          payload: { ...location, id, updatedAt: now },
        });

        const storedLocation = await tx.query.locations.findFirst({
          columns: { palaceId: true },
          where: eq(schema.locations.id, id),
        });

        if (storedLocation?.palaceId) {
          await refreshPalaceLocationCount(tx, storedLocation.palaceId, now);
        }
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

    async upsertMany(serverLocations: Location[]): Promise<void> {
      if (serverLocations.length === 0) return;

      const ids = serverLocations.map((l) => l.id);

      await db.transaction(async (tx) => {
        const localRecords = await tx.query.locations.findMany({
          where: inArray(schema.locations.id, ids),
        });
        const localMap = new Map(localRecords.map((r) => [r.id, r]));

        const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.LOCATION);

        const now = new Date().toISOString();

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
