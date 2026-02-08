import { MAX_REVIEW_ROUND } from '@/constants/config';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SourceType } from '@/enums/sourceType';
import { SyncBase } from '@/services/sync/sync.base';
import { ReviewSchedule } from '@/types/lesson';
import { calculateNextDueDate, REVIEW_INTERVALS } from '@/utils/review';
import { and, asc, eq, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export function useReviewRepository() {
  /**
   * Get review schedule for a lesson
   */
  const getReviewSchedule = async (userId: string, lessonProgressId: string) => {
    return await db.query.reviewSchedules.findMany({
      where: and(
        eq(schema.reviewSchedules.userId, userId),
        eq(schema.reviewSchedules.lessonProgressId, lessonProgressId)
      ),
    });
  };

  /**
   * Create a review schedule
   */
  const scheduleNextRound = async (
    tx: any,
    {
      userId,
      progressId,
      currentRound,
      completedDate,
    }: { userId: string; progressId: string; currentRound: number; completedDate: Date }
  ) => {
    const nextRound = currentRound + 1;
    const intervalConfig = REVIEW_INTERVALS[nextRound];

    if (nextRound <= MAX_REVIEW_ROUND && intervalConfig) {
      // Check if next round already exists to prevent duplicates
      const nextExists = await tx.query.reviewSchedules.findFirst({
        where: and(
          eq(schema.reviewSchedules.lessonProgressId, progressId),
          eq(schema.reviewSchedules.reviewRound, nextRound)
        ),
      });

      if (!nextExists) {
        const nextDueDate = calculateNextDueDate(completedDate, intervalConfig);
        const scheduleId = Crypto.randomUUID();
        await tx.insert(schema.reviewSchedules).values({
          id: scheduleId,
          userId,
          lessonProgressId: progressId,
          reviewRound: nextRound,
          dueDate: nextDueDate.toISOString(),
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.REVIEW_SCHEDULE,
          entityId: scheduleId,
          action: 'create',
          payload: {
            userId,
            lessonProgressId: progressId,
            reviewRound: nextRound,
            dueDate: nextDueDate.toISOString(),
            completed: false,
          },
        });
      }
    }
  };

  const handleRoundCompletion = async (
    tx: any,
    {
      userId,
      progressId,
      reviewId,
      roundNumber,
      completedDate,
    }: {
      userId: string;
      progressId: string;
      reviewId: string;
      roundNumber: number;
      completedDate: string;
    }
  ) => {
    await tx
      .update(schema.reviewSchedules)
      .set({
        completed: true,
        completedDate: completedDate,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.reviewSchedules.id, reviewId));

    await scheduleNextRound(tx, {
      userId,
      progressId,
      currentRound: roundNumber,
      completedDate: new Date(completedDate),
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
    const nowIso = new Date().toISOString();
    const isPassed = correctCount / totalCount >= 0.8;

    await db.transaction(async (tx) => {
      const currentProgress = await tx.query.lessonProgress.findFirst({
        where: eq(schema.lessonProgress.lessonId, lessonId),
        with: {
          reviewSchedules: {
            where: eq(schema.reviewSchedules.completed, false),
            orderBy: asc(schema.reviewSchedules.dueDate),
            limit: 1,
          },
        },
      });

      const progressId = currentProgress?.id ?? Crypto.randomUUID();
      const currentReview = currentProgress?.reviewSchedules[0];
      const currentRound = currentReview?.reviewRound ?? 0;

      await tx
        .insert(schema.lessonProgress)
        .values({
          id: progressId,
          userId,
          lessonId,
          firstCompletedDate: nowIso,
          totalReviews: isPassed ? 1 : 0,
          masteryLevel: 'learning',
          lastReviewDate: nowIso,
          xpEarned,
          createdAt: nowIso,
          updatedAt: nowIso,
          isDeleted: false,
        })
        .onConflictDoUpdate({
          target: schema.lessonProgress.id,
          set: {
            totalReviews: isPassed
              ? sql`${schema.lessonProgress.totalReviews} + 1`
              : schema.lessonProgress.totalReviews,
            masteryLevel: isPassed && currentRound >= MAX_REVIEW_ROUND ? 'mastered' : 'reviewing',
            lastReviewDate: nowIso,
            xpEarned: sql`${schema.lessonProgress.xpEarned} + ${xpEarned}`,
            updatedAt: nowIso,
          },
        });

      if (isPassed && currentReview) {
        // Mark current round as completed
        await handleRoundCompletion(tx, {
          userId,
          progressId,
          reviewId: currentReview.id,
          roundNumber: currentRound,
          completedDate: nowIso,
        });
      }

      await tx
        .update(schema.users)
        .set({
          totalXp: sql`${schema.users.totalXp} + ${xpEarned}`,
          updatedAt: nowIso,
        })
        .where(eq(schema.users.id, userId));

      // 5. Update User Stats (Streaks & Total Count)
      await tx
        .insert(schema.userStats)
        .values({
          userId,
          lessonsCompleted: isPassed ? 1 : 0,
          lastActiveDate: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
        .onConflictDoUpdate({
          target: schema.userStats.userId,
          set: {
            lessonsCompleted: isPassed
              ? sql`${schema.userStats.lessonsCompleted} + 1`
              : schema.userStats.lessonsCompleted,
            lastActiveDate: nowIso,
            updatedAt: nowIso,
            // Note: Streak logic usually requires comparing lastActiveDate
            // with 'yesterday' to increment or reset.
          },
        });

      // 6. Sync Queue Logging
      if (xpEarned > 0) {
        const xpEventId = Crypto.randomUUID();
        await tx.insert(schema.xpEvents).values({
          id: xpEventId,
          userId,
          xpAmount: xpEarned,
          sourceType: SourceType.ReviewComplete,
          sourceId: lessonId,
          clientEventId: xpEventId,
          createdAt: nowIso,
        });

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.XP_EVENT,
          entityId: xpEventId,
          action: 'create',
          payload: {
            id: xpEventId,
            userId,
            xpAmount: xpEarned,
            sourceType: SourceType.ReviewComplete,
            sourceId: lessonId,
            clientEventId: xpEventId,
            createdAt: nowIso,
          },
        });
      }

      await SyncBase.addToQueue(tx as any, {
        entityType: 'lesson_progress',
        entityId: progressId,
        action: 'update',
        payload: {},
      });
    });
  };

  /**
   * Upsert review schedules from server
   */
  const upsertMany = async (reviewSchedules: Array<ReviewSchedule>) => {
    if (reviewSchedules.length === 0) return;

    const now = new Date().toISOString();

    for (const review of reviewSchedules) {
      await db
        .insert(schema.reviewSchedules)
        .values({
          id: review.id,
          userId: review.userId,
          lessonProgressId: review.lessonProgressId,
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
          where: sql`${schema.reviewSchedules.updatedAt} < ${review.updatedAt}`,
        });
    }
  };

  return {
    scheduleNextRound,
    getReviewSchedule,
    completeReview,
    updateLessonProgressAfterReview,
    upsertMany,
  };
}
