import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export function useUserStatsRepository() {
  /**
   * Get user stats
   */
  const getByUserId = async (userId: string) => {
    return await db.query.userStats.findFirst({
      where: eq(schema.userStats.userId, userId),
    });
  };

  /**
   * Create or update user stats
   */
  const upsert = async (userId: string, stats: Partial<typeof schema.userStats.$inferInsert>) => {
    const now = new Date().toISOString();
    await db
      .insert(schema.userStats)
      .values({
        userId,
        lessonsCompleted: stats.lessonsCompleted ?? 0,
        wordsLearned: stats.wordsLearned ?? 0,
        currentStreak: stats.currentStreak ?? 0,
        longestStreak: stats.longestStreak ?? 0,
        lastActiveDate: stats.lastActiveDate || now,
        updatedAt: now,
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
        },
      });
  };

  /**
   * Upsert multiple user stats from server
   */
  const upsertMany = async (
    userStatsList: Array<{
      userId: string;
      lessonsCompleted?: number;
      wordsLearned?: number;
      currentStreak?: number;
      longestStreak?: number;
      lastActiveDate?: string;
    }>
  ) => {
    if (userStatsList.length === 0) return;

    const now = new Date().toISOString();

    for (const stats of userStatsList) {
      await db
        .insert(schema.userStats)
        .values({
          userId: stats.userId,
          lessonsCompleted: stats.lessonsCompleted ?? 0,
          wordsLearned: stats.wordsLearned ?? 0,
          currentStreak: stats.currentStreak ?? 0,
          longestStreak: stats.longestStreak ?? 0,
          lastActiveDate: stats.lastActiveDate || now,
          updatedAt: now,
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
          },
        });
    }
  };

  return {
    getByUserId,
    upsert,
    upsertMany,
  };
}
