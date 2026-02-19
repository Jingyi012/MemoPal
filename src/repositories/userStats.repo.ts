import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';

interface UserStatsRepository {
  get(): Promise<typeof schema.userStats.$inferSelect | null>;
  save(stats: Partial<typeof schema.userStats.$inferInsert>): Promise<void>;
  upsertFromServer(stats: any): Promise<void>;
}

export function createUserStatsRepository(): UserStatsRepository {
  return {
    /**
     * Get the stats for the current user.
     * Since it's a single-user cache, we just fetch the first (and only) row.
     */
    async get(): Promise<typeof schema.userStats.$inferSelect | null> {
      return (await db.query.userStats.findFirst()) ?? null;
    },

    /**
     * Update local stats and queue for sync.
     */
    async save(stats: Partial<typeof schema.userStats.$inferInsert>): Promise<void> {
      const now = new Date().toISOString();

      // We need the userId from the users table to maintain the FK relationship
      const user = await db.query.users.findFirst({ columns: { id: true } });
      if (!user) throw new Error('No user found in local cache');

      await db.transaction(async (tx) => {
        await tx
          .insert(schema.userStats)
          .values({
            userId: user.id,
            lessonsCompleted: stats.lessonsCompleted ?? 0,
            wordsLearned: stats.wordsLearned ?? 0,
            currentStreak: stats.currentStreak ?? 0,
            longestStreak: stats.longestStreak ?? 0,
            lastActiveDate: stats.lastActiveDate || now,
            updatedAt: now,
            lastSyncedAt: null,
          })
          .onConflictDoUpdate({
            target: schema.userStats.userId,
            set: {
              lessonsCompleted: stats.lessonsCompleted,
              wordsLearned: stats.wordsLearned,
              currentStreak: stats.currentStreak,
              longestStreak: stats.longestStreak,
              lastActiveDate: stats.lastActiveDate || now,
              updatedAt: now,
              lastSyncedAt: null,
            },
          });

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.USER_STATS,
          entityId: user.id,
          action: 'update',
          payload: { ...stats, updatedAt: now },
        });
      });
    },

    /**
     * Conflict resolution for server-side stats.
     * Usually, UserStats is a single object per user, so we handle it as a single upsert.
     */
    async upsertFromServer(serverStats: any): Promise<void> {
      const now = new Date().toISOString();
      const local = await this.get();

      // Check if local version is "dirty" (has pending sync items)
      const dirtyIds = await SyncBase.getEntityDirtyIds(
        db as any,
        [serverStats.userId],
        EntityType.USER_STATS
      );

      if (dirtyIds.has(serverStats.userId)) return;

      if (!local || new Date(serverStats.updatedAt || now) > new Date(local.updatedAt)) {
        await db
          .insert(schema.userStats)
          .values({
            ...serverStats,
            lastSyncedAt: now,
          })
          .onConflictDoUpdate({
            target: schema.userStats.userId,
            set: {
              ...serverStats,
              lastSyncedAt: now,
            },
          });
      }
    },
  };
}
