import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { Badge } from '@/types/levelAndbadge';
import { and, eq } from 'drizzle-orm';

export function useBadgeRepository() {
  /**
   * Get all available badges
   */
  const getAll = async () => {
    return await db.query.badges.findMany();
  };

  /**
   * Get user's earned badges
   */
  const getUserBadges = async (userId: string) => {
    return await db.query.userBadges.findMany({
      where: eq(schema.userBadges.userId, userId),
      with: {
        badge: true,
      },
    });
  };

  /**
   * Check if user has earned a badge
   */
  const hasEarnedBadge = async (userId: string, badgeId: string): Promise<boolean> => {
    const result = await db.query.userBadges.findFirst({
      where: and(eq(schema.userBadges.userId, userId), eq(schema.userBadges.badgeId, badgeId)),
    });
    return !!result;
  };

  /**
   * Award a badge to user
   */
  const awardBadge = async (userId: string, badgeId: string) => {
    const now = new Date().toISOString();
    await db.insert(schema.userBadges).values({
      id: `${userId}-${badgeId}`,
      userId,
      badgeId,
      earnedAt: now,
    });
  };

  /**
   * Get badge by ID
   */
  const getById = async (id: string) => {
    return await db.query.badges.findFirst({
      where: eq(schema.badges.id, id),
    });
  };

  /**
   * Upsert badges from server
   */
  const upsertMany = async (badges: Badge[]) => {
    if (badges.length === 0) return;

    const now = new Date().toISOString();

    for (const badge of badges) {
      await db
        .insert(schema.badges)
        .values({
          ...badge,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.badges.id,
          set: {
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            rarity: badge.rarity,
            updatedAt: now,
          },
        });
    }
  };

  /**
   * Upsert user badges from server
   */
  const upsertUserBadges = async (
    userId: string,
    userBadges: Array<{ badgeId: string; earnedAt: string }>
  ) => {
    if (userBadges.length === 0) return;

    for (const ub of userBadges) {
      await db
        .insert(schema.userBadges)
        .values({
          id: `${userId}-${ub.badgeId}`,
          userId,
          badgeId: ub.badgeId,
          earnedAt: ub.earnedAt,
        })
        .onConflictDoNothing();
    }
  };

  return {
    getAll,
    getUserBadges,
    hasEarnedBadge,
    awardBadge,
    getById,
    upsertMany,
    upsertUserBadges,
  };
}
