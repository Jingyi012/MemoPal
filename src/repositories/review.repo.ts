import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { and, eq, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export function useReviewRepository() {
  /**
   * Get review schedule for a lesson
   */
  const getReviewSchedule = async (userId: string, lessonId: string) => {
    return await db.query.reviewSchedules.findMany({
      where: and(
        eq(schema.reviewSchedules.userId, userId),
        eq(schema.reviewSchedules.lessonId, lessonId)
      ),
    });
  };

  /**
   * Create a review schedule
   */
  const insertReview = async (
    userId: string,
    lessonId: string,
    reviewRound: number,
    dueDate: string
  ) => {
    const now = new Date().toISOString();
    const id = Crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(schema.reviewSchedules).values({
        id,
        userId,
        lessonId,
        reviewRound,
        dueDate,
        completed: false,
        createdAt: now,
        updatedAt: now,
      });

      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.REVIEW_SCHEDULE,
        entityId: id,
        action: 'create',
        payload: {
          lessonId,
          reviewRound,
          dueDate,
          completed: false,
        },
      });
    });
  };

  /**
   * Mark a review as completed
   */
  const completeReview = async (reviewScheduleId: string) => {
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx
        .update(schema.reviewSchedules)
        .set({
          completed: true,
          completedDate: now,
          updatedAt: now,
        })
        .where(eq(schema.reviewSchedules.id, reviewScheduleId));

      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.REVIEW_SCHEDULE,
        entityId: reviewScheduleId,
        action: 'update',
        payload: { completed: true, completedDate: now },
      });
    });
  };

  /**
   * Update lesson progress after review
   */
  const updateLessonProgressAfterReview = async (
    userId: string,
    lessonId: string,
    xpEarned: number,
    correctCount: number,
    totalCount: number
  ) => {
    const now = new Date().toISOString();
    const progressId = `${userId}-${lessonId}`;
    const isComplete = correctCount === totalCount;

    await db.transaction(async (tx) => {
      // Upsert lesson progress
      await tx
        .insert(schema.lessonProgress)
        .values({
          id: progressId,
          userId,
          lessonId,
          firstCompletedDate: now,
          totalReviews: 1,
          masteryLevel: isComplete ? 'reviewing' : 'learning',
          lastReviewDate: now,
          xpEarned,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        })
        .onConflictDoUpdate({
          target: schema.lessonProgress.id,
          set: {
            totalReviews: sql`${schema.lessonProgress.totalReviews} + 1`,
            lastReviewDate: now,
            xpEarned: sql`${schema.lessonProgress.xpEarned} + ${xpEarned}`,
            updatedAt: now,
          },
        });

      // Add to sync queue
      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.LESSON_PROGRESS,
        entityId: progressId,
        action: 'update',
        payload: {
          userId,
          lessonId,
          xpEarned,
          correctCount,
          totalCount,
          lastReviewDate: now,
        },
      });
    });
  };

  /**
   * Upsert review schedules from server
   */
  const upsertMany = async (reviewSchedules: Array<{
    id: string;
    userId: string;
    lessonId: string;
    reviewRound: number;
    dueDate: string;
    completed: boolean;
    completedDate?: string;
    createdAt: string;
    updatedAt?: string;
    lastSyncedAt?: string;
  }>) => {
    if (reviewSchedules.length === 0) return;

    const now = new Date().toISOString();

    for (const review of reviewSchedules) {
      await db
        .insert(schema.reviewSchedules)
        .values({
          id: review.id,
          userId: review.userId,
          lessonId: review.lessonId,
          reviewRound: review.reviewRound,
          dueDate: review.dueDate,
          completed: review.completed,
          completedDate: review.completedDate,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt || now,
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
  };

  return {
    getReviewSchedule,
    completeReview,
    updateLessonProgressAfterReview,
    upsertMany,
  };
}
