import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Milestone } from '@/types/levelAndbadge';
import { eq, isNotNull } from 'drizzle-orm';

interface MilestoneRepository {
  getAll(): Promise<Milestone[]>;
  getById(id: string): Promise<Milestone | null | undefined>;
  getAchieved(): Promise<Milestone[]>;
  hasAchieved(milestoneId: string): Promise<boolean>;
  awardMilestone(milestoneId: string): Promise<void>;
  upsertMany(milestones: Milestone[]): Promise<void>;
}

export function createMilestoneRepository(): MilestoneRepository {
  return {
    /**
     * Get all possible milestones (locked and unlocked)
     */
    async getAll(): Promise<Milestone[]> {
      return await db.query.milestones.findMany();
    },

    async getById(id: string): Promise<Milestone | null | undefined> {
      return await db.query.milestones.findFirst({
        where: eq(schema.milestones.id, id),
      });
    },

    /**
     * Get only the milestones the current user has achieved
     */
    async getAchieved(): Promise<Milestone[]> {
      return await db.query.milestones.findMany({
        where: isNotNull(schema.milestones.achievedAt),
      });
    },

    async hasAchieved(milestoneId: string): Promise<boolean> {
      const result = await db.query.milestones.findFirst({
        where: eq(schema.milestones.id, milestoneId),
        columns: { achievedAt: true },
      });
      return !!result?.achievedAt;
    },

    /**
     * Marks a milestone as achieved locally and queues for sync
     */
    async awardMilestone(milestoneId: string): Promise<void> {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        // Update the milestone record directly
        await tx
          .update(schema.milestones)
          .set({
            achievedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.milestones.id, milestoneId));

        // Queue for backend sync
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.MILESTONE,
          entityId: milestoneId,
          action: 'update',
          payload: { id: milestoneId, achievedAt: now, updatedAt: now },
        });
      });
    },

    /**
     * Syncs milestones from server.
     * If the server says it's achieved, we update our local record.
     */
    async upsertMany(milestones: Milestone[]): Promise<void> {
      if (milestones.length === 0) return;
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        for (const milestone of milestones) {
          await tx
            .insert(schema.milestones)
            .values({
              ...milestone,
              updatedAt: now,
              lastSyncedAt: now,
            })
            .onConflictDoUpdate({
              target: schema.milestones.id,
              set: {
                key: milestone.key,
                title: milestone.title,
                description: milestone.description,
                conditionType: milestone.conditionType,
                conditionValue: milestone.conditionValue,
                // Only overwrite achievedAt if the server has a value
                achievedAt: milestone.achievedAt,
                updatedAt: now,
                lastSyncedAt: now,
              },
            });
        }
      });
    },
  };
}
