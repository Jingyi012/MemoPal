import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { LessonProgress } from '@/types/lesson';
import { eq, inArray } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { createReviewRepository } from './review.repo';

/**
 * LessonProgressRepository - Local database operations only
 * Handles CRUD operations for lesson progress with offline-first support
 * No business logic or direct API calls
 */
export interface LessonProgressRepository {
  /**
   * Get progress for a specific lesson by ID
   */
  getLessonProgress(lessonId: string): Promise<LessonProgress | null>;

  /**
   * Initialize new lesson progress
   */
  initLessonProgress(lessonId: string): Promise<LessonProgress>;

  /**
   * Ensure learning mode is initialized with first review schedule
   */
  ensureLearningInitialized(progress: LessonProgress): Promise<void>;

  /**
   * Save progress (offline-first, queues for sync)
   */
  saveProgress(progress: LessonProgress): Promise<void>;

  /**
   * Delete progress (soft delete, queues for sync)
   */
  delete(lessonId: string): Promise<void>;

  /**
   * Upsert progress with conflict resolution
   */
  upsertMany(progressList: Partial<LessonProgress>[]): Promise<void>;
}

/**
 * Create LessonProgressRepository factory
 */
export function createLessonProgressRepository(): LessonProgressRepository {
  /**
   * Internal helper: apply server version to local DB
   */
  const applyServerVersion = async (
    tx: any,
    item: Partial<LessonProgress>,
    progressId: string,
    syncTime: string
  ): Promise<void> => {
    await tx
      .insert(schema.lessonProgress)
      .values({
        id: progressId,
        lessonId: item.lessonId!,
        firstCompletedDate: item.firstCompletedDate,
        masteryLevel: item.masteryLevel || 'new',
        lastReviewDate: item.lastReviewDate,
        xpEarned: item.xpEarned ?? 0,
        totalReviews: item.totalReviews ?? 0,
        createdAt: item.createdAt || syncTime,
        updatedAt: item.updatedAt || syncTime,
        lastSyncedAt: syncTime,
        isDeleted: Boolean(item.isDeleted),
      })
      .onConflictDoUpdate({
        target: schema.lessonProgress.lessonId,
        set: {
          masteryLevel: item.masteryLevel,
          lastReviewDate: item.lastReviewDate,
          totalReviews: item.totalReviews,
          xpEarned: item.xpEarned,
          updatedAt: item.updatedAt || syncTime,
          lastSyncedAt: syncTime,
        },
      });
  };

  return {
    async getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
      try {
        const result = await db.query.lessonProgress.findFirst({
          where: eq(schema.lessonProgress.lessonId, lessonId),
          with: {
            reviewSchedules: {
              orderBy: (entries, { asc }) => [asc(entries.reviewRound)],
            },
          },
        });

        if (!result) {
          return null;
        }

        return result as LessonProgress;
      } catch (err) {
        console.error('Error fetching lesson progress:', err);
        return null;
      }
    },

    async initLessonProgress(lessonId: string): Promise<LessonProgress> {
      const now = new Date().toISOString();
      const id = Crypto.randomUUID();
      const progress: LessonProgress = {
        id,
        lessonId,
        firstCompletedDate: null,
        masteryLevel: 'new',
        totalReviews: 0,
        xpEarned: 0,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: null,
        isDeleted: false,
        reviewSchedules: [],
      };

      await db.insert(schema.lessonProgress).values(progress).onConflictDoNothing();

      return progress;
    },

    async ensureLearningInitialized(progress: LessonProgress): Promise<void> {
      if (progress.masteryLevel !== 'learning') return;

      const hasSchedule = progress.reviewSchedules && progress.reviewSchedules.length > 0;
      if (hasSchedule) return;

      await db.transaction(async (tx) => {
        const reviewRepo = createReviewRepository();
        await reviewRepo.scheduleNextRound(tx as any, {
          progressId: progress.id,
          currentRound: 0,
          completedDate: new Date(),
        });
      });
    },

    async saveProgress(progress: LessonProgress): Promise<void> {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        const progressId = progress.id ?? Crypto.randomUUID();

        await tx
          .insert(schema.lessonProgress)
          .values({
            ...progress,
            id: progressId,
            updatedAt: now,
            lastSyncedAt: null,
          })
          .onConflictDoUpdate({
            target: schema.lessonProgress.id,
            set: {
              masteryLevel: progress.masteryLevel,
              firstCompletedDate: progress.firstCompletedDate,
              lastReviewDate: progress.lastReviewDate,
              totalReviews: progress.totalReviews,
              xpEarned: progress.xpEarned,
              updatedAt: now,
            },
          });

        // Queue for backend sync
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LESSON_PROGRESS,
          entityId: progress.lessonId,
          action: 'update',
          payload: { ...progress, id: progressId, updatedAt: now },
        });
      });
    },

    async delete(lessonId: string): Promise<void> {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        const record = await tx.query.lessonProgress.findFirst({
          columns: { id: true, lastSyncedAt: true },
          where: eq(schema.lessonProgress.lessonId, lessonId),
        });

        if (!record) return;

        // Soft delete
        await tx
          .update(schema.lessonProgress)
          .set({
            isDeleted: true,
            deletedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.lessonProgress.lessonId, lessonId));

        // Queue for backend sync
        if (record.lastSyncedAt) {
          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.LESSON_PROGRESS,
            entityId: lessonId,
            action: 'delete',
          });
        } else {
          await SyncBase.removePendingSyncs(tx as any, lessonId);
        }

        // Also delete related review schedules
        await tx
          .delete(schema.reviewSchedules)
          .where(eq(schema.reviewSchedules.lessonProgressId, record.id));
      });
    },

    async upsertMany(progressList: Partial<LessonProgress>[]): Promise<void> {
      if (progressList.length === 0) return;

      const now = new Date().toISOString();
      const lessonIds = progressList.map((p) => p.lessonId!);

      await db.transaction(async (tx) => {
        // Get local records for conflict resolution
        const localRecords = await tx.query.lessonProgress.findMany({
          where: inArray(schema.lessonProgress.lessonId, lessonIds),
        });
        const localMap = new Map(localRecords.map((r) => [r.lessonId, r]));

        // Get dirty IDs
        const dirtyIds = await SyncBase.getEntityDirtyIds(
          tx as any,
          lessonIds,
          EntityType.LESSON_PROGRESS
        );

        for (const progress of progressList) {
          const localProgress = localMap.get(progress.lessonId!);
          const isDirty = dirtyIds.has(progress.lessonId!);

          // Skip if locally modified
          if (isDirty) continue;

          const progressId = progress.id ?? Crypto.randomUUID();

          if (!localProgress) {
            // New from server
            await applyServerVersion(tx, progress, progressId, now);
          } else {
            const serverDate = new Date(progress.updatedAt || new Date(0).toISOString()).getTime();
            const localDate = new Date(localProgress.updatedAt).getTime();

            if (serverDate > localDate) {
              // Server is newer: apply server version
              await applyServerVersion(tx, progress, progressId, now);
            } else if (localDate > serverDate) {
              // Local is newer: queue for sync
              await SyncBase.addToQueue(tx as any, {
                entityType: EntityType.LESSON_PROGRESS,
                entityId: localProgress.lessonId,
                action: 'update',
                payload: { ...localProgress },
              });
            }
          }

          // Upsert review schedules if they exist
          if (progress.reviewSchedules && progress.reviewSchedules.length > 0) {
            for (const review of progress.reviewSchedules) {
              const reviewId = review.id || Crypto.randomUUID();

              await tx
                .insert(schema.reviewSchedules)
                .values({
                  id: reviewId,
                  lessonProgressId: progressId,
                  reviewRound: review.reviewRound,
                  dueDate: review.dueDate,
                  completed: review.completed,
                  completedDate: review.completedDate,
                  createdAt: review.createdAt || now,
                  updatedAt: now,
                  lastSyncedAt: now,
                })
                .onConflictDoUpdate({
                  target: schema.reviewSchedules.id,
                  set: {
                    completed: review.completed,
                    completedDate: review.completedDate,
                    dueDate: review.dueDate,
                    updatedAt: now,
                    lastSyncedAt: now,
                  },
                });
            }
          }
        }
      });
    },
  };
}
