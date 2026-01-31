import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { Milestone } from '@/types/levelAndbadge';
import { and, eq } from 'drizzle-orm';

export function useMilestoneRepository() {
  /**
   * Get all milestones
   */
  const getAll = async () => {
    return await db.query.milestones.findMany();
  };

  /**
   * Get user's achieved milestones
   */
  const getUserMilestones = async (userId: string) => {
    return await db.query.userMilestones.findMany({
      where: eq(schema.userMilestones.userId, userId),
      with: {
        milestone: true,
      },
    });
  };

  /**
   * Check if user has achieved a milestone
   */
  const hasAchieved = async (userId: string, milestoneId: string): Promise<boolean> => {
    const result = await db.query.userMilestones.findFirst({
      where: and(
        eq(schema.userMilestones.userId, userId),
        eq(schema.userMilestones.milestoneId, milestoneId)
      ),
    });
    return !!result;
  };

  /**
   * Award a milestone to user
   */
  const awardMilestone = async (userId: string, milestoneId: string) => {
    const now = new Date().toISOString();
    await db.insert(schema.userMilestones).values({
      id: `${userId}-${milestoneId}`,
      userId,
      milestoneId,
      achievedAt: now,
    });
  };

  /**
   * Get milestone by ID
   */
  const getById = async (id: string) => {
    return await db.query.milestones.findFirst({
      where: eq(schema.milestones.id, id),
    });
  };

  /**
   * Upsert milestones from server
   */
  const upsertMany = async (milestones: Milestone[]) => {
    if (milestones.length === 0) return;

    const now = new Date().toISOString();

    for (const milestone of milestones) {
      await db
        .insert(schema.milestones)
        .values({
          ...milestone,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.milestones.id,
          set: {
            key: milestone.key,
            title: milestone.title,
            description: milestone.description,
            conditionType: milestone.conditionType,
            conditionValue: milestone.conditionValue,
            updatedAt: now,
          },
        });
    }
  };

  /**
   * Upsert user milestones from server
   */
  const upsertUserMilestones = async (
    userId: string,
    userMilestones: Array<{ milestoneId: string; achievedAt: string }>
  ) => {
    if (userMilestones.length === 0) return;

    for (const um of userMilestones) {
      await db
        .insert(schema.userMilestones)
        .values({
          id: `${userId}-${um.milestoneId}`,
          userId,
          milestoneId: um.milestoneId,
          achievedAt: um.achievedAt,
        })
        .onConflictDoNothing();
    }
  };

  return {
    getAll,
    getUserMilestones,
    hasAchieved,
    awardMilestone,
    getById,
    upsertMany,
    upsertUserMilestones,
  };
}
