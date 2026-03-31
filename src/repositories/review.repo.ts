import { MAX_REVIEW_ROUND, REVIEW_PASS_THRESHOLD } from '@/constants/config';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { InAppNotificationSync } from '@/services/notification/inAppNotificationSync';
import { PushNotificationService } from '@/services/notification/pushNotificationService';
import { SyncBase } from '@/services/sync/sync.base';
import { LessonProgress, ReviewSchedule } from '@/types/lesson';
import { DueReviewLessonPreview, ReviewStats } from '@/types/review';
import { resolveNextStreak } from '@/utils/gamification/streak';
import { calculateNextDueDate, REVIEW_INTERVALS } from '@/utils/review';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export interface ReviewRepository {
  getReviewSchedule(lessonProgressId: string): Promise<ReviewSchedule[]>;
  getDueReviews(): Promise<ReviewSchedule[]>;
  getDueReviewLessons(limit?: number): Promise<DueReviewLessonPreview[]>;
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
  upsertMany(
    reviewSchedules: ReviewSchedule[],
    options?: { pruneByProgressId?: string }
  ): Promise<void>;
  getReviewStats(): Promise<ReviewStats>;
}

export function createReviewRepository(): ReviewRepository {
  const pendingReviewsWhere = (dueBeforeIso?: string) =>
    dueBeforeIso
      ? and(
          eq(schema.reviewSchedules.completed, false),
          eq(schema.reviewSchedules.isDeleted, false),
          sql`${schema.reviewSchedules.dueDate} <= ${dueBeforeIso}`
        )
      : and(
          eq(schema.reviewSchedules.completed, false),
          eq(schema.reviewSchedules.isDeleted, false)
        );

  const getPendingReviews = async (dueBeforeIso?: string): Promise<ReviewSchedule[]> => {
    return await db.query.reviewSchedules.findMany({
      where: pendingReviewsWhere(dueBeforeIso),
      orderBy: asc(schema.reviewSchedules.dueDate),
    });
  };

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
      let rev = await getPendingReviews(now);
      return rev;
    },

    async getDueReviewLessons(limit = 2): Promise<DueReviewLessonPreview[]> {
      const nowIso = new Date().toISOString();
      const nowMs = Date.now();

      const rows = await db
        .select({
          reviewId: schema.reviewSchedules.id,
          lessonProgressId: schema.reviewSchedules.lessonProgressId,
          lessonId: schema.lessons.id,
          lessonTitle: schema.lessons.title,
          dueDate: schema.reviewSchedules.dueDate,
        })
        .from(schema.reviewSchedules)
        .innerJoin(
          schema.lessonProgress,
          eq(schema.reviewSchedules.lessonProgressId, schema.lessonProgress.id)
        )
        .innerJoin(schema.lessons, eq(schema.lessonProgress.lessonId, schema.lessons.id))
        .where(
          and(
            eq(schema.reviewSchedules.completed, false),
            eq(schema.reviewSchedules.isDeleted, false),
            sql`${schema.reviewSchedules.dueDate} <= ${nowIso}`,
            eq(schema.lessonProgress.isDeleted, false),
            eq(schema.lessons.isDeleted, false)
          )
        )
        .orderBy(asc(schema.reviewSchedules.dueDate));

      const seenLessonIds = new Set<string>();
      const previews: DueReviewLessonPreview[] = [];

      for (const row of rows) {
        if (seenLessonIds.has(row.lessonId)) continue;
        seenLessonIds.add(row.lessonId);

        previews.push({
          reviewId: row.reviewId,
          lessonProgressId: row.lessonProgressId,
          lessonId: row.lessonId,
          lessonTitle: row.lessonTitle,
          dueDate: row.dueDate,
          isOverdue: new Date(row.dueDate).getTime() < nowMs,
        });

        if (previews.length >= Math.max(1, limit)) {
          break;
        }
      }

      return previews;
    },

    async scheduleNextRound(tx: any, { progress, currentRound, completedDate }): Promise<void> {
      const nextRound = currentRound + 1;
      const intervalConfig = REVIEW_INTERVALS[nextRound];

      if (nextRound <= MAX_REVIEW_ROUND && intervalConfig) {
        const nextDueDate = calculateNextDueDate(completedDate, intervalConfig);
        const reviewId = Crypto.randomUUID();
        const now = new Date().toISOString();

        const lessonRows = await tx
          .select()
          .from(schema.lessons)
          .where(eq(schema.lessons.id, progress.lessonId))
          .limit(1);

        const lesson = lessonRows[0];
        const lessonId = lesson?.id || progress.lessonId || '';
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

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.REVIEW_SCHEDULE,
          entityId: reviewId,
          action: 'create',
          payload: {
            id: reviewId,
            lessonProgressId: progress.id,
            lessonId,
            reviewRound: nextRound,
            dueDate: nextDueDate.toISOString(),
            completed: false,
            completedDate: null,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
            deletedAt: null,
          },
        });

        await PushNotificationService.scheduleReview({
          reviewId: reviewId,
          lessonId: lessonId,
          lessonName: lessonName,
          dueDate: nextDueDate.toISOString(),
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
      const nowDate = new Date();
      const nowIso = nowDate.toISOString();
      const isPassed = correctCount / totalCount >= REVIEW_PASS_THRESHOLD;

      await db.transaction(async (tx) => {
        const currentProgress = await tx.query.lessonProgress.findFirst({
          where: and(
            eq(schema.lessonProgress.lessonId, lessonId),
            eq(schema.lessonProgress.isDeleted, false)
          ),
          with: {
            reviewSchedules: {
              where: and(
                eq(schema.reviewSchedules.completed, false),
                eq(schema.reviewSchedules.isDeleted, false)
              ),
              orderBy: asc(schema.reviewSchedules.dueDate),
              limit: 1,
            },
          },
        });

        if (!currentProgress) return;

        const currentUser = await tx.query.users.findFirst();
        if (!currentUser) return;

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

        // 3. Update user lesson stats + activity streak (XP is handled by xpEvents service)
        const currentStats = await tx.query.userStats.findFirst({
          where: eq(schema.userStats.userId, currentUser.id),
        });
        const nextStreak = resolveNextStreak(
          {
            currentStreak: currentStats?.currentStreak ?? 0,
            longestStreak: currentStats?.longestStreak ?? 0,
            lastActiveDate: currentStats?.lastActiveDate ?? null,
          },
          nowDate
        );
        const wordsDelta = isPassed ? totalCount : 0;
        const lessonsCompleted = Math.max(
          0,
          (currentStats?.lessonsCompleted ?? 0) + (isPassed ? 1 : 0)
        );
        const wordsLearned = Math.max(0, (currentStats?.wordsLearned ?? 0) + wordsDelta);

        if (currentStats) {
          await tx
            .update(schema.userStats)
            .set({
              lessonsCompleted,
              wordsLearned,
              currentStreak: nextStreak.currentStreak,
              longestStreak: nextStreak.longestStreak,
              lastActiveDate: nowIso,
              updatedAt: nowIso,
            })
            .where(eq(schema.userStats.userId, currentUser.id));
        } else {
          await tx.insert(schema.userStats).values({
            userId: currentUser.id,
            lessonsCompleted,
            wordsLearned,
            currentStreak: nextStreak.currentStreak,
            longestStreak: nextStreak.longestStreak,
            lastActiveDate: nowIso,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.USER_STATS,
          entityId: currentUser.id,
          action: 'update',
          payload: {
            lessonsCompleted,
            wordsLearned,
            currentStreak: nextStreak.currentStreak,
            longestStreak: nextStreak.longestStreak,
            lastActiveDate: nowIso,
            updatedAt: nowIso,
          },
        });

        const refreshedProgress = await tx.query.lessonProgress.findFirst({
          where: and(
            eq(schema.lessonProgress.id, currentProgress.id),
            eq(schema.lessonProgress.isDeleted, false)
          ),
          with: {
            reviewSchedules: {
              where: eq(schema.reviewSchedules.isDeleted, false),
              orderBy: asc(schema.reviewSchedules.reviewRound),
            },
          },
        });

        // 6. Queue lesson progress for sync
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LESSON_PROGRESS,
          entityId: currentProgress.lessonId,
          action: 'update',
          payload: refreshedProgress
            ? { ...refreshedProgress }
            : {
                ...currentProgress,
                lessonId: currentProgress.lessonId,
                updatedAt: nowIso,
                totalReviews: currentProgress.totalReviews + (isPassed ? 1 : 0),
                masteryLevel:
                  isPassed && currentRound >= MAX_REVIEW_ROUND ? 'mastered' : 'reviewing',
                lastReviewDate: nowIso,
                xpEarned: currentProgress.xpEarned + xpEarned,
              },
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

    async upsertMany(
      reviewSchedules: ReviewSchedule[],
      options?: { pruneByProgressId?: string }
    ): Promise<void> {
      const now = new Date().toISOString();
      const ids = reviewSchedules.map((r) => r.id);

      await db.transaction(async (tx) => {
        const localRecords =
          ids.length > 0
            ? await tx.query.reviewSchedules.findMany({
                where: inArray(schema.reviewSchedules.id, ids),
              })
            : [];
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

        if (options?.pruneByProgressId) {
          const activeProgressReviews = await tx.query.reviewSchedules.findMany({
            columns: { id: true },
            where: and(
              eq(schema.reviewSchedules.lessonProgressId, options.pruneByProgressId),
              eq(schema.reviewSchedules.isDeleted, false)
            ),
          });

          const remoteIds = new Set(reviewSchedules.map((review) => review.id));
          const candidateIds = activeProgressReviews
            .map((row) => row.id)
            .filter((id) => !remoteIds.has(id));

          if (candidateIds.length > 0) {
            const dirtyCandidateIds = await SyncBase.getEntityDirtyIds(
              tx as any,
              candidateIds,
              EntityType.REVIEW_SCHEDULE
            );

            const pruneIds = candidateIds.filter((id) => !dirtyCandidateIds.has(id));
            if (pruneIds.length > 0) {
              await tx
                .update(schema.reviewSchedules)
                .set({
                  isDeleted: true,
                  deletedAt: now,
                  updatedAt: now,
                  lastSyncedAt: now,
                })
                .where(inArray(schema.reviewSchedules.id, pruneIds));
            }
          }
        }

        await InAppNotificationSync.syncAllUpcoming();
      });
    },

    async getReviewStats(): Promise<ReviewStats> {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayIso = endOfDay.toISOString();

      // 1. Get Due counts (Today vs Future)
      const schedules = await getPendingReviews();

      const dueTodayCount = schedules.filter((s) => s.dueDate <= endOfDayIso).length;
      const upcomingReviewsCount = schedules.filter((s) => s.dueDate > endOfDayIso).length;

      // 2. Aggregate Mastery and Totals from Lesson Progress
      const progressStats = await db
        .select({
          masteredCount: sql<number>`count(case when ${schema.lessonProgress.masteryLevel} = 'mastered' then 1 end)`,
          totalReviews: sql<number>`sum(${schema.lessonProgress.totalReviews})`,
          // Assuming accuracy is handled by a different metric or average XP if needed
        })
        .from(schema.lessonProgress)
        .where(eq(schema.lessonProgress.isDeleted, false));

      return {
        totalLessonsMastered: Number(progressStats[0]?.masteredCount ?? 0),
        totalReviewsCompleted: Number(progressStats[0]?.totalReviews ?? 0),
        dueTodayCount,
        upcomingReviewsCount,
      };
    },
  };
}
