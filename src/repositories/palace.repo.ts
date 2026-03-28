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
  upsertMany(serverPalaces: Palace[], options?: { pruneMissingOfficial?: boolean }): Promise<void>;
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
        orderBy: [asc(schema.palaces.level), asc(schema.palaces.createdAt)],
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
      const requestedId = palace.id;
      const id = requestedId || Crypto.randomUUID();
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        const existing = requestedId
          ? await tx.query.palaces.findFirst({
              where: eq(schema.palaces.id, requestedId),
            })
          : null;

        const currentUser = await tx.query.users.findFirst({ columns: { id: true } });

        if (existing) {
          const mergedPalace: Partial<Palace> = {
            ...(existing as Palace),
            ...palace,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: now,
            lastSyncedAt: null,
          };

          if (!mergedPalace.name || !mergedPalace.description || !mergedPalace.thumbnail) {
            throw new Error('Palace name, description and thumbnail are required.');
          }

          const ownerId = mergedPalace.isCustom
            ? mergedPalace.createdBy || currentUser?.id || null
            : mergedPalace.createdBy || null;

          await tx
            .update(schema.palaces)
            .set({
              name: mergedPalace.name,
              description: mergedPalace.description,
              locationsCount: mergedPalace.locationsCount ?? 0,
              thumbnail: mergedPalace.thumbnail,
              isLocked: mergedPalace.isLocked ?? false,
              isPremium: mergedPalace.isPremium ?? false,
              isCustom: mergedPalace.isCustom ?? false,
              level: mergedPalace.level ?? 1,
              createdBy: ownerId,
              unlockedAt: Object.prototype.hasOwnProperty.call(mergedPalace, 'unlockedAt')
                ? (mergedPalace.unlockedAt ?? null)
                : existing.unlockedAt,
              isDeleted: mergedPalace.isDeleted ?? false,
              deletedAt: Object.prototype.hasOwnProperty.call(mergedPalace, 'deletedAt')
                ? (mergedPalace.deletedAt ?? null)
                : existing.deletedAt,
              updatedAt: now,
              lastSyncedAt: null,
            })
            .where(eq(schema.palaces.id, existing.id));

          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.PALACE,
            entityId: existing.id,
            action: 'update',
            payload: {
              ...mergedPalace,
              id: existing.id,
              createdBy: ownerId,
              updatedAt: now,
              lastSyncedAt: null,
            },
          });
          return;
        }

        if (!palace.name || !palace.description || !palace.thumbnail) {
          throw new Error('Palace name, description and thumbnail are required.');
        }

        const isCustom = palace.isCustom ?? false;
        const ownerId = isCustom
          ? palace.createdBy || currentUser?.id || null
          : palace.createdBy || null;

        const createPayload: Partial<Palace> = {
          id,
          name: palace.name,
          description: palace.description,
          locationsCount: palace.locationsCount ?? 0,
          thumbnail: palace.thumbnail,
          isLocked: palace.isLocked ?? false,
          isPremium: palace.isPremium ?? false,
          isCustom,
          level: palace.level ?? 1,
          createdBy: ownerId ?? undefined,
          unlockedAt: Object.prototype.hasOwnProperty.call(palace, 'unlockedAt')
            ? (palace.unlockedAt ?? null)
            : isCustom
              ? now
              : null,
          createdAt: palace.createdAt || now,
          updatedAt: now,
          lastSyncedAt: null,
          isDeleted: false,
          deletedAt: null,
        };

        await tx.insert(schema.palaces).values({
          id,
          name: createPayload.name!,
          description: createPayload.description!,
          locationsCount: createPayload.locationsCount ?? 0,
          thumbnail: createPayload.thumbnail!,
          isLocked: createPayload.isLocked ?? false,
          isPremium: createPayload.isPremium ?? false,
          isCustom: createPayload.isCustom ?? false,
          level: createPayload.level ?? 1,
          createdBy: ownerId,
          unlockedAt: createPayload.unlockedAt ?? null,
          createdAt: createPayload.createdAt || now,
          updatedAt: now,
          lastSyncedAt: null,
          isDeleted: false,
          deletedAt: null,
        });

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.PALACE,
          entityId: id,
          action: 'create',
          payload: { ...createPayload, id, createdBy: ownerId ?? undefined },
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

    async upsertMany(
      serverPalaces: Palace[],
      options?: { pruneMissingOfficial?: boolean }
    ): Promise<void> {
      const ids = serverPalaces.map((p) => p.id);
      const now = new Date().toISOString();
      const pruneMissingOfficial = options?.pruneMissingOfficial ?? false;

      await db.transaction(async (tx) => {
        const localRecords =
          ids.length > 0
            ? await tx.query.palaces.findMany({
                where: inArray(schema.palaces.id, ids),
              })
            : [];
        const localMap = new Map(localRecords.map((r) => [r.id, r]));
        const dirtyIds =
          ids.length > 0
            ? await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.PALACE)
            : new Set<string>();

        const dirtyQueueRows = await tx.query.syncQueue.findMany({
          columns: { entityId: true },
          where: eq(schema.syncQueue.entityType, EntityType.PALACE),
        });
        const dirtyPalaceIds = new Set(dirtyQueueRows.map((row) => row.entityId));
        const currentUser = await tx.query.users.findFirst({ columns: { id: true } });
        const currentUserId = currentUser?.id;
        const canManageLocalPalace = (item: Palace | undefined) =>
          Boolean(currentUserId && item?.isCustom && item.createdBy === currentUserId);

        for (const serverItem of serverPalaces) {
          const localItem = localMap.get(serverItem.id);
          const isDirty = dirtyIds.has(serverItem.id);
          const canManageServerItem = canManageLocalPalace(
            (localItem as Palace | undefined) ?? serverItem
          );

          if (isDirty) {
            // Never sync unauthorized local edits for shared/admin-configured palaces.
            if (!canManageServerItem) {
              await SyncBase.removePendingSyncs(tx as any, serverItem.id);
              dirtyPalaceIds.delete(serverItem.id);
              await applyServerVersion(tx, serverItem, now);
            }
            continue;
          }

          if (!localItem) {
            await applyServerVersion(tx, serverItem, now);
          } else {
            // Server response includes user-computed fields (e.g. isLocked), so for shared/admin
            // palaces we always trust and apply server snapshot even when updatedAt is unchanged.
            if (!canManageServerItem) {
              await applyServerVersion(tx, serverItem, now);
              continue;
            }

            const serverDate = new Date(serverItem.updatedAt).getTime();
            const localDate = new Date(localItem.updatedAt).getTime();

            if (serverDate > localDate) {
              await applyServerVersion(tx, serverItem, now);
            } else if (localDate > serverDate) {
              if (canManageLocalPalace(localItem as Palace)) {
                await SyncBase.addToQueue(tx as any, {
                  entityType: EntityType.PALACE,
                  entityId: localItem.id,
                  action: 'update',
                  payload: { ...localItem },
                });
              } else {
                // Revert unauthorized local divergence to server truth.
                await applyServerVersion(tx, serverItem, now);
              }
            }
          }
        }

        if (pruneMissingOfficial) {
          const syncedOfficialPalaces = await tx.query.palaces.findMany({
            columns: { id: true },
            where: and(
              eq(schema.palaces.isCustom, false),
              eq(schema.palaces.isDeleted, false),
              isNotNull(schema.palaces.lastSyncedAt)
            ),
          });

          const serverIdSet = new Set(ids);
          const staleIds = syncedOfficialPalaces
            .map((row) => row.id)
            .filter((id) => !serverIdSet.has(id) && !dirtyPalaceIds.has(id));

          if (staleIds.length > 0) {
            await tx
              .update(schema.palaces)
              .set({
                isDeleted: true,
                deletedAt: now,
                updatedAt: now,
                lastSyncedAt: now,
              })
              .where(inArray(schema.palaces.id, staleIds));
          }
        }
      });
    },
  };
}
