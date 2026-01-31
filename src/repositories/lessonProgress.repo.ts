import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { LessonProgress } from '@/types/lesson';
import { calculateNextDueDate, REVIEW_INTERVALS } from '@/utils/review';
import { and, eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export function useLessonProgressRepository(userId: string) {
  /**
   * Fetch progress and all related review rounds
   */
  const getLessonProgress = async (lessonId: string): Promise<LessonProgress | null> => {
    const result = await db.query.lessonProgress.findFirst({
      where: eq(schema.lessonProgress.lessonId, lessonId),
      with: {
        reviewSchedules: {
          orderBy: (entries, { asc }) => [asc(entries.reviewRound)],
        },
      },
    });

    if (!result) return null;

    // Map DB schema (reviewSchedules) back to the Interface (reviewSchedule)
    return {
      ...result,
      reviewSchedule: result.reviewSchedules,
    } as unknown as LessonProgress;
  };

  /**
   * Save progress, update rounds, and conditionally generate the next round
   */
  const saveProgress = async (progress: LessonProgress) => {
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      // 1. Upsert Lesson Progress
      await tx
        .insert(schema.lessonProgress)
        .values({
          id: progress.id ?? Crypto.randomUUID(),
          userId,
          lessonId: progress.lessonId,
          firstCompletedDate: progress.firstCompletedDate,
          masteryLevel: progress.masteryLevel,
          lastReviewDate: progress.lastReviewDate,
          xpEarned: progress.xpEarned,
          totalReviews: progress.totalReviews,
          createdAt: progress.createdAt || now,
          updatedAt: now,
          lastSyncedAt: progress.lastSyncedAt,
        })
        .onConflictDoUpdate({
          target: schema.lessonProgress.lessonId,
          set: {
            masteryLevel: progress.masteryLevel,
            lastReviewDate: progress.lastReviewDate,
            totalReviews: progress.totalReviews,
            updatedAt: now,
            lastSyncedAt: progress.lastSyncedAt,
          },
        });

      // 2. Upsert Review Schedules
      for (const review of progress.reviewSchedule) {
        const reviewId = review.id || Crypto.randomUUID();

        await tx
          .insert(schema.reviewSchedules)
          .values({
            id: reviewId,
            userId,
            lessonId: progress.lessonId,
            reviewRound: review.reviewRound,
            dueDate: review.dueDate,
            completed: review.completed,
            completedDate: review.completedDate,

            createdAt: review.createdAt || now,
            updatedAt: now,
            lastSyncedAt: review.lastSyncedAt,
          })
          .onConflictDoUpdate({
            target: schema.reviewSchedules.id,
            set: {
              completed: review.completed,
              completedDate: review.completedDate,
              dueDate: review.dueDate,
              updatedAt: now,
            },
          });

        // 3. Logic: Generate NEXT round if this one was just completed
        if (review.completed && review.completedDate) {
          const nextRoundNumber = review.reviewRound + 1;
          const intervalConfig = REVIEW_INTERVALS[review.reviewRound];

          if (intervalConfig) {
            // Check if next round already exists
            const nextExists = await tx.query.reviewSchedules.findFirst({
              where: and(
                eq(schema.reviewSchedules.lessonId, progress.lessonId),
                eq(schema.reviewSchedules.reviewRound, nextRoundNumber)
              ),
            });

            if (!nextExists) {
              const nextDueDate = calculateNextDueDate(review.completedDate, intervalConfig);

              await tx.insert(schema.reviewSchedules).values({
                id: Crypto.randomUUID(),
                userId,
                lessonId: progress.lessonId,
                reviewRound: nextRoundNumber,
                dueDate: nextDueDate.toISOString(),
                completed: false,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }
      }

      // 4. Queue for Sync
      // Note: SyncBase needs to be adapted to accept Drizzle Transaction 'tx'
      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.LESSON_PROGRESS,
        entityId: progress.lessonId,
        action: 'update',
        payload: {
          ...progress,
          updatedAt: now,
        },
      });
    });
  };

  /**
   * Handle removal and sync queue cleanup
   */
  const remove = async (lessonId: string) => {
    await db.transaction(async (tx) => {
      const record = await tx.query.lessonProgress.findFirst({
        columns: { lastSyncedAt: true },
        where: eq(schema.lessonProgress.lessonId, lessonId),
      });

      if (!record) return;

      if (record.lastSyncedAt) {
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LESSON_PROGRESS,
          entityId: lessonId,
          action: 'delete',
          payload: null,
        });
      } else {
        await SyncBase.removePendingSyncs(tx as any, lessonId);
      }

      // Deleting the progress will cascade to reviewSchedules if FK is set to cascade
      // Otherwise, delete both manually:
      await tx.delete(schema.reviewSchedules).where(eq(schema.reviewSchedules.lessonId, lessonId));
      await tx.delete(schema.lessonProgress).where(eq(schema.lessonProgress.lessonId, lessonId));
    });
  };

  /**
   * Upsert lesson progress from server
   */
  const upsertMany = async (progressList: Partial<LessonProgress>[]) => {
    if (progressList.length === 0) return;

    const now = new Date().toISOString();

    for (const progress of progressList) {
      await db.transaction(async (tx) => {
        // Upsert lesson progress
        await tx
          .insert(schema.lessonProgress)
          .values({
            id: progress.id ?? Crypto.randomUUID(),
            userId,
            lessonId: progress.lessonId!,
            firstCompletedDate: progress.firstCompletedDate,
            masteryLevel: progress.masteryLevel,
            lastReviewDate: progress.lastReviewDate,
            xpEarned: progress.xpEarned ?? 0,
            totalReviews: progress.totalReviews ?? 0,
            createdAt: progress.createdAt || now,
            updatedAt: now,
            lastSyncedAt: progress.lastSyncedAt || now,
            isDeleted: Boolean(progress.isDeleted),
          })
          .onConflictDoUpdate({
            target: schema.lessonProgress.lessonId,
            set: {
              masteryLevel: progress.masteryLevel,
              lastReviewDate: progress.lastReviewDate,
              totalReviews: progress.totalReviews,
              xpEarned: progress.xpEarned,
              updatedAt: now,
              lastSyncedAt: progress.lastSyncedAt || now,
            },
          });

        // Upsert review schedules if they exist
        if (progress.reviewSchedule && progress.reviewSchedule.length > 0) {
          for (const review of progress.reviewSchedule) {
            const reviewId = review.id || Crypto.randomUUID();

            await tx
              .insert(schema.reviewSchedules)
              .values({
                id: reviewId,
                userId,
                lessonId: progress.lessonId!,
                reviewRound: review.reviewRound,
                dueDate: review.dueDate,
                completed: review.completed,
                completedDate: review.completedDate,
                createdAt: review.createdAt || now,
                updatedAt: now,
                lastSyncedAt: review.lastSyncedAt || now,
              })
              .onConflictDoUpdate({
                target: schema.reviewSchedules.id,
                set: {
                  completed: review.completed,
                  completedDate: review.completedDate,
                  dueDate: review.dueDate,
                  updatedAt: now,
                  lastSyncedAt: review.lastSyncedAt || now,
                },
              });
          }
        }
      });
    }
  };

  return { getLessonProgress, saveProgress, remove, upsertMany };
}
