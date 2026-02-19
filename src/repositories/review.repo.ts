import { MAX_REVIEW_ROUND } from '@/constants/config';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SourceType } from '@/enums/sourceType';
import { InAppNotificationSync } from '@/services/notification/inAppNotificationSync';
import { PushNotificationService } from '@/services/notification/pushNotificationService';
import { SyncBase } from '@/services/sync/sync.base';
import { LessonProgress, ReviewSchedule } from '@/types/lesson';
import { ReviewStats } from '@/types/review';
import { calculateNextDueDate, REVIEW_INTERVALS } from '@/utils/review';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export interface ReviewRepository {
  getReviewSchedule(lessonProgressId: string): Promise<ReviewSchedule[]>;
  getDueReviews(): Promise<ReviewSchedule[]>;
  scheduleNextRound(
    tx: any,
    options: {
      progress: LessonProgress;
      currentRound: number;
      completedDate: Date;
    }
  ): Promise<void>;
  handleRoundCompletion(
    tx: any,
    options: {
      progress: LessonProgress;
      reviewId: string;
      roundNumber: number;
      completedDate: string;
    }
  ): Promise<void>;
  updateLessonProgressAfterReview(
    lessonId: string,
    xpEarned: number,
    correctCount: number,
    totalCount: number
  ): Promise<void>;
  delete(reviewScheduleId: string): Promise<void>;
  upsertMany(reviewSchedules: ReviewSchedule[]): Promise<void>;
  getReviewStats(): Promise<ReviewStats>;
}

export function createReviewRepository(): ReviewRepository {
  return {
    async getReviewSchedule(lessonProgressId: string): Promise<ReviewSchedule[]> {
      return await db.query.reviewSchedules.findMany({
        where: and(
          eq(schema.reviewSchedules.lessonProgressId, lessonProgressId),
          eq(schema.reviewSchedules.isDeleted, false)
        ),
      });
    },

    async getDueReviews(): Promise<ReviewSchedule[]> {
      const now = new Date().toISOString();
      return await db.query.reviewSchedules.findMany({
        where: and(
          eq(schema.reviewSchedules.completed, false),
          eq(schema.reviewSchedules.isDeleted, false),
          sql`${schema.reviewSchedules.dueDate} <= ${now}`
        ),
        orderBy: asc(schema.reviewSchedules.dueDate),
      });
    },

    async scheduleNextRound(tx: any, { progress, currentRound, completedDate }): Promise<void> {
      const nextRound = currentRound + 1;
      const intervalConfig = REVIEW_INTERVALS[nextRound];

      if (nextRound <= MAX_REVIEW_ROUND && intervalConfig) {
        const nextDueDate = calculateNextDueDate(completedDate, intervalConfig);
        const reviewId = Crypto.randomUUID();
        const now = new Date().toISOString();

        const lesson = await tx.query.lesson.findFirst({
          where: eq(schema.lessons.id, progress.lessonId),
        });
        const lessonId = lesson?.id || '';
        const lessonName = lesson?.title || 'Lesson';

        await tx
          .insert(schema.reviewSchedules)
          .values({
            id: reviewId,
            lessonProgressId: progress.id,
            reviewRound: nextRound,
            dueDate: nextDueDate.toISOString(),
            completed: false,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: null,
          })
          .onConflictDoNothing();

        await PushNotificationService.scheduleReview({
          reviewId: reviewId,
          lessonId: lessonId,
          lessonName: lessonName,
          dueDate: nextDueDate.toISOString(),
        });

        await SyncBase.addToQueue(tx, {
          entityType: EntityType.REVIEW_SCHEDULE,
          entityId: reviewId,
          action: 'create',
          payload: {
            lessonProgressId: progress.id,
            reviewRound: nextRound,
            dueDate: nextDueDate.toISOString(),
            completed: false,
          },
        });
      }
    },

    async handleRoundCompletion(
      tx: any,
      { progress, reviewId, roundNumber, completedDate }
    ): Promise<void> {
      const now = new Date().toISOString();

      await tx
        .update(schema.reviewSchedules)
        .set({
          completed: true,
          completedDate,
          updatedAt: now,
        })
        .where(eq(schema.reviewSchedules.id, reviewId));

      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.REVIEW_SCHEDULE,
        entityId: reviewId,
        action: 'update',
        payload: { completed: true, completedDate: now },
      });

      await PushNotificationService.cancelReview(reviewId);

      await this.scheduleNextRound(tx, {
        progress: progress,
        currentRound: roundNumber,
        completedDate: new Date(completedDate),
      });
    },

    async updateLessonProgressAfterReview(
      lessonId: string,
      xpEarned: number,
      correctCount: number,
      totalCount: number
    ): Promise<void> {
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

        if (!currentProgress) return;

        const currentReview = currentProgress.reviewSchedules[0];
        const currentRound = currentReview?.reviewRound ?? 0;

        // 1. Update Lesson Progress
        await tx
          .update(schema.lessonProgress)
          .set({
            totalReviews: isPassed
              ? sql`${schema.lessonProgress.totalReviews} + 1`
              : schema.lessonProgress.totalReviews,
            masteryLevel: isPassed && currentRound >= MAX_REVIEW_ROUND ? 'mastered' : 'reviewing',
            lastReviewDate: nowIso,
            xpEarned: sql`${schema.lessonProgress.xpEarned} + ${xpEarned}`,
            updatedAt: nowIso,
          })
          .where(eq(schema.lessonProgress.id, currentProgress.id));

        // 2. Handle Schedule update
        if (isPassed && currentReview) {
          await this.handleRoundCompletion(tx, {
            progress: currentProgress,
            reviewId: currentReview.id,
            roundNumber: currentRound,
            completedDate: nowIso,
          });
        }

        // 3. Update User XP & Stats (Targeting the only user in the table)
        await tx.update(schema.users).set({
          totalXp: sql`${schema.users.totalXp} + ${xpEarned}`,
          updatedAt: nowIso,
        });

        await tx.update(schema.userStats).set({
          lessonsCompleted: isPassed
            ? sql`${schema.userStats.lessonsCompleted} + 1`
            : schema.userStats.lessonsCompleted,
          lastActiveDate: nowIso,
          updatedAt: nowIso,
        });

        // 4. Log XP event
        if (xpEarned > 0) {
          const xpEventId = Crypto.randomUUID();
          await tx.insert(schema.xpEvents).values({
            id: xpEventId,
            xpAmount: xpEarned,
            sourceType: SourceType.ReviewComplete,
            sourceId: lessonId,
            clientEventId: xpEventId,
            createdAt: nowIso,
            updatedAt: nowIso,
          });

          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.XP_EVENT,
            entityId: xpEventId,
            action: 'create',
            payload: {
              xpAmount: xpEarned,
              sourceType: SourceType.ReviewComplete,
              sourceId: lessonId,
            },
          });
        }

        // 5. Queue lesson progress for sync
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LESSON_PROGRESS,
          entityId: currentProgress.id,
          action: 'update',
          payload: { id: currentProgress.id, updatedAt: nowIso },
        });
      });
    },

    async delete(reviewScheduleId: string): Promise<void> {
      await db.transaction(async (tx) => {
        const record = await tx.query.reviewSchedules.findFirst({
          columns: { lastSyncedAt: true },
          where: eq(schema.reviewSchedules.id, reviewScheduleId),
        });

        if (!record) return;
        const now = new Date().toISOString();

        if (record.lastSyncedAt) {
          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.REVIEW_SCHEDULE,
            entityId: reviewScheduleId,
            action: 'delete',
          });
        } else {
          await SyncBase.removePendingSyncs(tx as any, reviewScheduleId);
        }

        await tx
          .update(schema.reviewSchedules)
          .set({ isDeleted: true, deletedAt: now, updatedAt: now })
          .where(eq(schema.reviewSchedules.id, reviewScheduleId));
      });
    },

    async upsertMany(reviewSchedules: ReviewSchedule[]): Promise<void> {
      if (reviewSchedules.length === 0) return;
      const now = new Date().toISOString();
      const ids = reviewSchedules.map((r) => r.id);

      await db.transaction(async (tx) => {
        const localRecords = await tx.query.reviewSchedules.findMany({
          where: inArray(schema.reviewSchedules.id, ids),
        });
        const localMap = new Map(localRecords.map((r) => [r.id, r]));
        const dirtyIds = await SyncBase.getEntityDirtyIds(
          tx as any,
          ids,
          EntityType.REVIEW_SCHEDULE
        );

        for (const review of reviewSchedules) {
          if (dirtyIds.has(review.id)) continue;

          const localReview = localMap.get(review.id);
          const serverDate = new Date(review.updatedAt || now).getTime();
          const localDate = localReview ? new Date(localReview.updatedAt).getTime() : 0;

          if (!localReview || serverDate > localDate) {
            await tx
              .insert(schema.reviewSchedules)
              .values({ ...review, lastSyncedAt: now, isDeleted: Boolean(review.isDeleted) })
              .onConflictDoUpdate({
                target: schema.reviewSchedules.id,
                set: {
                  completed: review.completed,
                  completedDate: review.completedDate,
                  dueDate: review.dueDate,
                  isDeleted: Boolean(review.isDeleted),
                  deletedAt: review.deletedAt,
                  updatedAt: review.updatedAt || now,
                  lastSyncedAt: now,
                },
              });
          }
        }

        await InAppNotificationSync.syncAllUpcoming();
      });
    },

    async getReviewStats(): Promise<ReviewStats> {
      const now = new Date().toISOString();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayIso = endOfDay.toISOString();

      // 1. Get Due counts (Today vs Future)
      const schedules = await db
        .select({
          dueDate: schema.reviewSchedules.dueDate,
        })
        .from(schema.reviewSchedules)
        .where(
          and(
            eq(schema.reviewSchedules.completed, false),
            eq(schema.reviewSchedules.isDeleted, false)
          )
        );

      const dueTodayCount = schedules.filter((s) => s.dueDate <= endOfDayIso).length;
      const upcomingReviewsCount = schedules.filter((s) => s.dueDate > endOfDayIso).length;

      // 2. Aggregate Mastery and Totals from Lesson Progress
      const progressStats = await db
        .select({
          masteredCount: sql<number>`count(case when ${schema.lessonProgress.masteryLevel} = 'mastered' then 1 end)`,
          totalReviews: sql<number>`sum(${schema.lessonProgress.totalReviews})`,
          // Assuming accuracy is handled by a different metric or average XP if needed
        })
        .from(schema.lessonProgress);

      return {
        totalLessonsMastered: Number(progressStats[0]?.masteredCount ?? 0),
        totalReviewsCompleted: Number(progressStats[0]?.totalReviews ?? 0),
        dueTodayCount,
        upcomingReviewsCount,
      };
    },
  };
}
