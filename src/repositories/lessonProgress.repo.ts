import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { LessonProgress } from '@/types/lesson';
import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { useReviewRepository } from './review.repo';

export function useLessonProgressRepository(userId: string) {
  /**
   * Fetch progress and all related review rounds
   */
  const getLessonProgress = async (lessonId: string): Promise<LessonProgress | null> => {
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
        console.log('No lesson progress found for this lessonId');
        return null;
      }

      return {
        ...result,
      } as LessonProgress;
    } catch (err) {
      console.error('Error fetching lesson progress:', err);
      return null;
    }
  };

  /**
   * Initialize lesson progress
   */
  const initLessonProgress = async (lessonId: string): Promise<LessonProgress> => {
    const now = new Date().toISOString();
    const progress: LessonProgress = {
      id: Crypto.randomUUID(),
      userId,
      lessonId,
      firstCompletedDate: '',
      masteryLevel: 'new',
      totalReviews: 0,
      xpEarned: 0,
      createdAt: now,
      updatedAt: now,
      reviewSchedules: [],
    };

    await db.insert(schema.lessonProgress).values(progress).onConflictDoNothing();

    return progress;
  };

  const ensureLearningInitialized = async (progress: LessonProgress): Promise<void> => {
    if (progress.masteryLevel !== 'learning') return;

    const hasSchedule = progress.reviewSchedules && progress.reviewSchedules.length > 0;
    if (hasSchedule) return;

    await db.transaction(async (tx) => {
      const repo = useReviewRepository();
      repo.scheduleNextRound(tx, {
        userId,
        progressId: progress.id,
        currentRound: 0,
        completedDate: new Date(),
      });
    });
  };

  const saveProgress = async (progress: LessonProgress) => {
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      // 1. Upsert Lesson Progress
      var progressId = progress.id ?? Crypto.randomUUID();
      await tx
        .insert(schema.lessonProgress)
        .values({
          ...progress,
          id: progressId,
          userId,
          updatedAt: now,
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

      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.LESSON_PROGRESS,
        entityId: progress.lessonId,
        action: 'update',
        payload: { ...progress, updatedAt: now },
      });
    });
  };

  /**
   * Handle removal and sync queue cleanup
   */
  const remove = async (lessonId: string) => {
    await db.transaction(async (tx) => {
      const record = await tx.query.lessonProgress.findFirst({
        columns: { id: true, lastSyncedAt: true },
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
      await tx
        .delete(schema.reviewSchedules)
        .where(eq(schema.reviewSchedules.lessonProgressId, record.id));
      await tx.delete(schema.lessonProgress).where(eq(schema.lessonProgress.lessonId, lessonId));
    });
  };

  /**
   * Upsert lesson progress from server
   */
  const upsertMany = async (progressList: Partial<LessonProgress>[], isRemote: boolean = false) => {
    if (progressList.length === 0) return;

    const now = new Date().toISOString();

    for (const progress of progressList) {
      await db.transaction(async (tx) => {
        // Upsert lesson progress
        var progressId = progress.id ?? Crypto.randomUUID();
        await tx
          .insert(schema.lessonProgress)
          .values({
            id: progressId,
            userId,
            lessonId: progress.lessonId!,
            firstCompletedDate: progress.firstCompletedDate,
            masteryLevel: progress.masteryLevel,
            lastReviewDate: progress.lastReviewDate,
            xpEarned: progress.xpEarned ?? 0,
            totalReviews: progress.totalReviews ?? 0,
            createdAt: progress.createdAt || now,
            updatedAt: now,
            lastSyncedAt: !isRemote ? progress.lastSyncedAt : now,
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
              lastSyncedAt: !isRemote ? progress.lastSyncedAt : now,
            },
          });

        // Upsert review schedules if they exist
        if (progress.reviewSchedules && progress.reviewSchedules.length > 0) {
          for (const review of progress.reviewSchedules) {
            const reviewId = review.id || Crypto.randomUUID();

            await tx
              .insert(schema.reviewSchedules)
              .values({
                id: reviewId,
                userId,
                lessonProgressId: progressId,
                reviewRound: review.reviewRound,
                dueDate: review.dueDate,
                completed: review.completed,
                completedDate: review.completedDate,
                createdAt: review.createdAt || now,
                updatedAt: now,
                lastSyncedAt: !isRemote ? review.lastSyncedAt : now,
              })
              .onConflictDoUpdate({
                target: schema.reviewSchedules.id,
                set: {
                  completed: review.completed,
                  completedDate: review.completedDate,
                  dueDate: review.dueDate,
                  updatedAt: now,
                  lastSyncedAt: !isRemote ? review.lastSyncedAt : now,
                },
              });
          }
        }
      });
    }
  };

  return {
    getLessonProgress,
    initLessonProgress,
    ensureLearningInitialized,
    saveProgress,
    remove,
    upsertMany,
  };
}
