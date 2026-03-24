import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Milestone } from '@/types/levelAndbadge';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';

interface MilestoneRepository {
  getAll(): Promise<Milestone[]>;
  getById(id: string): Promise<Milestone | null | undefined>;
  getAchieved(): Promise<Milestone[]>;
  hasAchieved(milestoneId: string): Promise<boolean>;
  awardMilestone(milestoneId: string): Promise<void>;
  upsertMany(
    milestones: Milestone[],
    options?: {
      pruneMissing?: boolean;
    }
  ): Promise<void>;
}

export function createMilestoneRepository(): MilestoneRepository {
  return {
    async getAll(): Promise<Milestone[]> {
      return await db.query.milestones.findMany({
        where: eq(schema.milestones.isDeleted, false),
      });
    },

    async getById(id: string): Promise<Milestone | null | undefined> {
      return await db.query.milestones.findFirst({
        where: and(eq(schema.milestones.id, id), eq(schema.milestones.isDeleted, false)),
      });
    },

    async getAchieved(): Promise<Milestone[]> {
      return await db.query.milestones.findMany({
        where: and(isNotNull(schema.milestones.achievedAt), eq(schema.milestones.isDeleted, false)),
      });
    },

    async hasAchieved(milestoneId: string): Promise<boolean> {
      const result = await db.query.milestones.findFirst({
        where: and(eq(schema.milestones.id, milestoneId), eq(schema.milestones.isDeleted, false)),
        columns: { achievedAt: true },
      });
      return !!result?.achievedAt;
    },

    async awardMilestone(milestoneId: string): Promise<void> {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        await tx
          .update(schema.milestones)
          .set({
            achievedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.milestones.id, milestoneId));

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.MILESTONE,
          entityId: milestoneId,
          action: 'update',
          payload: { id: milestoneId, achievedAt: now, updatedAt: now },
        });
      });
    },

    async upsertMany(
      milestones: Milestone[],
      options: { pruneMissing?: boolean } = {}
    ): Promise<void> {
      const pruneMissing = Boolean(options.pruneMissing);
      const now = new Date().toISOString();
      const serverIds = milestones.map((m) => m.id);

      await db.transaction(async (tx) => {
        const localRecords = pruneMissing
          ? await tx.query.milestones.findMany({
              where: and(
                eq(schema.milestones.isDeleted, false),
                isNotNull(schema.milestones.lastSyncedAt)
              ),
            })
          : serverIds.length > 0
            ? await tx.query.milestones.findMany({
                where: inArray(schema.milestones.id, serverIds),
              })
            : [];

        const localMap = new Map(localRecords.map((record) => [record.id, record]));
        const dirtyCheckIds = Array.from(new Set([...localRecords.map((r) => r.id), ...serverIds]));
        const dirtyIds = await SyncBase.getEntityDirtyIds(
          tx as any,
          dirtyCheckIds,
          EntityType.MILESTONE
        );

        for (const milestone of milestones) {
          const localMilestone = localMap.get(milestone.id);
          const isDirty = dirtyIds.has(milestone.id);

          if (isDirty) {
            continue;
          }

          const serverTimestamp = new Date(milestone.updatedAt).getTime();
          const localTimestamp = localMilestone ? new Date(localMilestone.updatedAt).getTime() : 0;

          if (!localMilestone || serverTimestamp >= localTimestamp) {
            await tx
              .insert(schema.milestones)
              .values({
                ...milestone,
                lastSyncedAt: now,
                isDeleted: Boolean(milestone.isDeleted),
              })
              .onConflictDoUpdate({
                target: schema.milestones.id,
                set: {
                  key: milestone.key,
                  title: milestone.title,
                  description: milestone.description,
                  conditionType: milestone.conditionType,
                  conditionValue: milestone.conditionValue,
                  achievedAt: milestone.achievedAt ?? null,
                  updatedAt: milestone.updatedAt,
                  isDeleted: Boolean(milestone.isDeleted),
                  deletedAt: milestone.deletedAt ?? null,
                  lastSyncedAt: now,
                },
              });
            continue;
          }

          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.MILESTONE,
            entityId: localMilestone.id,
            action: 'update',
            payload: { ...localMilestone },
          });
        }

        if (pruneMissing) {
          const serverIdSet = new Set(serverIds);
          const staleIds = localRecords
            .filter((record) => !serverIdSet.has(record.id) && !dirtyIds.has(record.id))
            .map((record) => record.id);

          if (staleIds.length > 0) {
            await tx
              .update(schema.milestones)
              .set({
                isDeleted: true,
                deletedAt: now,
                updatedAt: now,
                lastSyncedAt: now,
              })
              .where(inArray(schema.milestones.id, staleIds));
          }
        }
      });
    },
  };
}
