import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Badge } from '@/types/levelAndbadge';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';

/**
 * BadgeRepository - Local database operations only
 * Handles CRUD operations for badges and user badges with offline-first support
 * No business logic or direct API calls
 */
interface BadgeRepository {
  getAll(): Promise<Badge[]>;
  getById(id: string): Promise<Badge | null | undefined>;
  hasEarnedBadge(userId: string, badgeId: string): Promise<boolean>;
  awardBadge(userId: string, badgeId: string): Promise<void>;
  upsertMany(badges: Badge[]): Promise<void>;
  delete(badgeId: string): Promise<void>;
}

export function createBadgeRepository(): BadgeRepository {
  return {
    /**
     * Get all available badges from local database
     */
    async getAll(): Promise<Badge[]> {
      return await db.query.badges.findMany();
    },

    /**
     * Get badge by ID from local database
     */
    async getById(id: string): Promise<Badge | null | undefined> {
      return await db.query.badges.findFirst({
        where: eq(schema.badges.id, id),
      });
    },

    /**
     * Check if user has earned a specific badge
     */
    async hasEarnedBadge(badgeId: string): Promise<boolean> {
      const result = await db.query.badges.findFirst({
        where: and(isNotNull(schema.badges.earnedAt), eq(schema.badges.id, badgeId)),
      });
      return !!result;
    },

    /**
     * Award a badge to user (offline-first, queues for sync)
     * Creates local record immediately and queues for backend sync
     */
    async awardBadge(badgeId: string): Promise<void> {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        await tx
          .update(schema.badges)
          .set({
            earnedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.badges.id, badgeId));

        // Queue for backend sync
        // TODO: Change to award
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.BADGE,
          entityId: badgeId,
          action: 'update',
          payload: { badgeId, earnedAt: now },
        });
      });
    },

    /**
     * Upsert badges from server with conflict resolution
     * Uses last-write-wins strategy based on updatedAt timestamp
     * Skips dirty (locally modified) items to prevent overwriting local changes
     */
    async upsertMany(badges: Badge[]): Promise<void> {
      if (badges.length === 0) return;

      const ids = badges.map((b) => b.id);
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        // Get local records for conflict resolution
        const localRecords = await tx.query.badges.findMany({
          where: inArray(schema.badges.id, ids),
        });
        const localMap = new Map(localRecords.map((r) => [r.id, r]));

        // Get dirty IDs (locally modified, queued for sync)
        const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.BADGE);

        for (const serverBadge of badges) {
          const localBadge = localMap.get(serverBadge.id);
          const isDirty = dirtyIds.has(serverBadge.id);

          // If not dirty and (new or server is newer): apply server version
          if (
            !isDirty &&
            (!localBadge || new Date(serverBadge.updatedAt) > new Date(localBadge.updatedAt))
          ) {
            await tx
              .insert(schema.badges)
              .values({
                ...serverBadge,
                lastSyncedAt: now,
              })
              .onConflictDoUpdate({
                target: schema.badges.id,
                set: {
                  name: serverBadge.name,
                  description: serverBadge.description,
                  icon: serverBadge.icon,
                  rarity: serverBadge.rarity,
                  updatedAt: serverBadge.updatedAt,
                  lastSyncedAt: now,
                },
              });
          }
        }
      });
    },

    /**
     * Delete badge locally (soft delete)
     * Queues delete action for backend sync
     */
    async delete(badgeId: string): Promise<void> {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        await tx
          .update(schema.badges)
          .set({
            isDeleted: true,
            deletedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.badges.id, badgeId));

        // Queue for backend sync
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.BADGE,
          entityId: badgeId,
          action: 'delete',
        });
      });
    },
  };
}
