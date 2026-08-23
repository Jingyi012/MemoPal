import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/core/sync/sync.base';
import type { LessonProgress } from '@/features/palace/shared/types/lesson.types';
import { and, desc, eq, inArray } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { createReviewRepository } from './review.repository';

export interface LessonProgressRepository {
  getLessonProgress(lessonId: string): Promise<LessonProgress | null>;
  initLessonProgress(lessonId: string): Promise<LessonProgress>;
  ensureLearningInitialized(progress: LessonProgress): Promise<void>;
  saveProgress(progress: LessonProgress): Promise<void>;
  delete(lessonId: string): Promise<void>;
  upsertMany(progressList: Partial<LessonProgress>[]): Promise<void>;
}

export function createLessonProgressRepository(): LessonProgressRepository {
  const applyServerVersion = async (tx: any, item: Partial<LessonProgress>, progressId: string, syncTime: string): Promise<void> => {
    const existing = await tx.query.lessonProgress.findFirst({ where: eq(schema.lessonProgress.id, progressId) });
    if (!existing) {
      await tx.insert(schema.lessonProgress).values({
        id: progressId, lessonId: item.lessonId!, firstCompletedDate: item.firstCompletedDate ?? null,
        masteryLevel: item.masteryLevel || 'new', lastReviewDate: item.lastReviewDate ?? null,
        xpEarned: item.xpEarned ?? 0, totalReviews: item.totalReviews ?? 0,
        createdAt: item.createdAt || syncTime, updatedAt: item.updatedAt || syncTime,
        lastSyncedAt: syncTime, isDeleted: Boolean(item.isDeleted), deletedAt: item.deletedAt ?? null,
      });
      return;
    }
    await tx.update(schema.lessonProgress).set({
      lessonId: item.lessonId!, firstCompletedDate: item.firstCompletedDate ?? null,
      masteryLevel: item.masteryLevel || 'new', lastReviewDate: item.lastReviewDate ?? null,
      xpEarned: item.xpEarned ?? 0, totalReviews: item.totalReviews ?? 0,
      updatedAt: item.updatedAt || syncTime, lastSyncedAt: syncTime,
      isDeleted: Boolean(item.isDeleted), deletedAt: item.deletedAt ?? null,
    }).where(eq(schema.lessonProgress.id, progressId));
  };
  const getProgressRowsByLesson = async (tx: any, lessonId: string) => tx.query.lessonProgress.findMany({
    where: eq(schema.lessonProgress.lessonId, lessonId), orderBy: [desc(schema.lessonProgress.updatedAt)],
  });
  const ensureSingleProgressRecord = async (tx: any, lessonId: string, options?: { preferredId?: string }): Promise<string | null> => {
    const now = new Date().toISOString();
    const rows = await getProgressRowsByLesson(tx, lessonId);
    if (rows.length === 0) return null;
    const preferredId = options?.preferredId?.trim();
    let canonical = preferredId ? rows.find((row: { id: string }) => row.id === preferredId) : undefined;
    canonical ??= rows.find((row: { isDeleted: any }) => !row.isDeleted) ?? rows[0];
    if (preferredId && canonical.id !== preferredId) {
      const preferredRow = await tx.query.lessonProgress.findFirst({ where: eq(schema.lessonProgress.id, preferredId) });
      if (!preferredRow) {
        await tx.insert(schema.lessonProgress).values({
          id: preferredId, lessonId, firstCompletedDate: canonical.firstCompletedDate,
          masteryLevel: canonical.masteryLevel, lastReviewDate: canonical.lastReviewDate,
          xpEarned: canonical.xpEarned, totalReviews: canonical.totalReviews,
          createdAt: canonical.createdAt, updatedAt: canonical.updatedAt,
          lastSyncedAt: canonical.lastSyncedAt, isDeleted: canonical.isDeleted, deletedAt: canonical.deletedAt,
        });
      }
      if (!preferredRow || preferredRow.lessonId === lessonId) canonical = { ...canonical, id: preferredId };
    }
    for (const row of rows) {
      if (row.id === canonical.id) continue;
      await tx.update(schema.reviewSchedules).set({ lessonProgressId: canonical.id, updatedAt: now, lastSyncedAt: null }).where(eq(schema.reviewSchedules.lessonProgressId, row.id));
      await tx.delete(schema.lessonProgress).where(eq(schema.lessonProgress.id, row.id));
    }
    return canonical.id;
  };

  return {
    async getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
      try {
        const result = await db.transaction(async (tx) => {
          const canonicalId = await ensureSingleProgressRecord(tx, lessonId);
          if (!canonicalId) return null;
          return tx.query.lessonProgress.findFirst({
            where: and(eq(schema.lessonProgress.id, canonicalId), eq(schema.lessonProgress.isDeleted, false)),
            with: { reviewSchedules: { where: eq(schema.reviewSchedules.isDeleted, false), orderBy: (entries, { asc }) => [asc(entries.reviewRound)] } },
          });
        });
        return result ? result as LessonProgress : null;
      } catch (error) {
        console.error('Error fetching lesson progress:', error);
        return null;
      }
    },
    async initLessonProgress(lessonId: string): Promise<LessonProgress> {
      const now = new Date().toISOString();
      let progress: LessonProgress = { id: Crypto.randomUUID(), lessonId, firstCompletedDate: null, masteryLevel: 'new', totalReviews: 0, xpEarned: 0, createdAt: now, updatedAt: now, lastSyncedAt: null, isDeleted: false, reviewSchedules: [] };
      await db.transaction(async (tx) => {
        const canonicalId = await ensureSingleProgressRecord(tx, lessonId);
        const existing = canonicalId ? await tx.query.lessonProgress.findFirst({
          where: eq(schema.lessonProgress.id, canonicalId),
          with: { reviewSchedules: { where: eq(schema.reviewSchedules.isDeleted, false), orderBy: (entries, { asc }) => [asc(entries.reviewRound)] } },
        }) : null;
        if (existing && !existing.isDeleted) { progress = existing as LessonProgress; return; }
        if (existing && existing.isDeleted) {
          await tx.update(schema.lessonProgress).set({ firstCompletedDate: null, masteryLevel: 'new', lastReviewDate: null, xpEarned: 0, totalReviews: 0, updatedAt: now, lastSyncedAt: null, isDeleted: false, deletedAt: null }).where(eq(schema.lessonProgress.id, existing.id));
          await tx.update(schema.reviewSchedules).set({ isDeleted: true, deletedAt: now, updatedAt: now, lastSyncedAt: null }).where(and(eq(schema.reviewSchedules.lessonProgressId, existing.id), eq(schema.reviewSchedules.isDeleted, false)));
          progress = { ...existing, firstCompletedDate: null, masteryLevel: 'new', lastReviewDate: null, xpEarned: 0, totalReviews: 0, updatedAt: now, lastSyncedAt: null, isDeleted: false, deletedAt: null, reviewSchedules: [] } as LessonProgress;
          await SyncBase.addToQueue(tx as any, { entityType: EntityType.LESSON_PROGRESS, entityId: lessonId, action: 'update', payload: { ...progress } });
          return;
        }
        await tx.insert(schema.lessonProgress).values(progress);
        await SyncBase.addToQueue(tx as any, { entityType: EntityType.LESSON_PROGRESS, entityId: lessonId, action: 'update', payload: { ...progress } });
      });
      return progress;
    },
    async ensureLearningInitialized(progress: LessonProgress): Promise<void> {
      if (progress.masteryLevel !== 'learning' || progress.reviewSchedules?.length > 0) return;
      await db.transaction(async (tx) => {
        const canonicalId = await ensureSingleProgressRecord(tx, progress.lessonId);
        if (!canonicalId) return;
        const canonicalProgress = await tx.query.lessonProgress.findFirst({
          where: eq(schema.lessonProgress.id, canonicalId),
          with: { reviewSchedules: { where: eq(schema.reviewSchedules.isDeleted, false), orderBy: (entries, { asc }) => [asc(entries.reviewRound)] } },
        });
        if (!canonicalProgress || canonicalProgress.reviewSchedules?.length > 0) return;
        await createReviewRepository().scheduleNextRound(tx as any, { progress: canonicalProgress as LessonProgress, currentRound: 0, completedDate: new Date() });
      });
    },
    async saveProgress(progress: LessonProgress): Promise<void> {
      const now = new Date().toISOString();
      await db.transaction(async (tx) => {
        const canonicalId = await ensureSingleProgressRecord(tx, progress.lessonId);
        const progressId = canonicalId ?? progress.id ?? Crypto.randomUUID();
        const existing = await tx.query.lessonProgress.findFirst({ where: eq(schema.lessonProgress.id, progressId) });
        if (!existing) {
          await tx.insert(schema.lessonProgress).values({ ...progress, id: progressId, updatedAt: now, lastSyncedAt: null });
        } else {
          await tx.update(schema.lessonProgress).set({ masteryLevel: progress.masteryLevel, firstCompletedDate: progress.firstCompletedDate, lastReviewDate: progress.lastReviewDate, totalReviews: progress.totalReviews, xpEarned: progress.xpEarned, isDeleted: Boolean(progress.isDeleted), deletedAt: progress.deletedAt ?? null, updatedAt: now, lastSyncedAt: null }).where(eq(schema.lessonProgress.id, progressId));
        }
        await SyncBase.addToQueue(tx as any, { entityType: EntityType.LESSON_PROGRESS, entityId: progress.lessonId, action: 'update', payload: { ...progress, id: progressId, updatedAt: now } });
      });
    },
    async delete(lessonId: string): Promise<void> {
      const now = new Date().toISOString();
      await db.transaction(async (tx) => {
        const canonicalId = await ensureSingleProgressRecord(tx, lessonId);
        const record = canonicalId ? await tx.query.lessonProgress.findFirst({ columns: { id: true, lastSyncedAt: true }, where: eq(schema.lessonProgress.id, canonicalId) }) : null;
        if (!record) return;
        const allRows = await getProgressRowsByLesson(tx, lessonId);
        const allIds = allRows.map((row: { id: any }) => row.id);
        await tx.update(schema.lessonProgress).set({ isDeleted: true, deletedAt: now, updatedAt: now }).where(eq(schema.lessonProgress.lessonId, lessonId));
        if (record.lastSyncedAt) {
          await SyncBase.addToQueue(tx as any, { entityType: EntityType.LESSON_PROGRESS, entityId: lessonId, action: 'delete', payload: { id: record.id, lessonId, isDeleted: true, deletedAt: now, updatedAt: now, reviewSchedules: [] } });
        } else {
          await SyncBase.removePendingSyncs(tx as any, lessonId);
        }
        if (allIds.length > 0) await tx.delete(schema.reviewSchedules).where(inArray(schema.reviewSchedules.lessonProgressId, allIds));
      });
    },
    async upsertMany(progressList: Partial<LessonProgress>[]): Promise<void> {
      if (progressList.length === 0) return;
      const now = new Date().toISOString();
      const lessonIds = progressList.map((progress) => progress.lessonId!);
      await db.transaction(async (tx) => {
        const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, lessonIds, EntityType.LESSON_PROGRESS);
        for (const progress of progressList) {
          if (!progress.lessonId) continue;
          const isDirty = dirtyIds.has(progress.lessonId);
          const canonicalId = await ensureSingleProgressRecord(tx, progress.lessonId, { preferredId: progress.id ?? undefined });
          const progressId = canonicalId ?? progress.id ?? Crypto.randomUUID();
          const localProgress = await tx.query.lessonProgress.findFirst({ where: eq(schema.lessonProgress.id, progressId) });
          if (!isDirty) {
            if (!localProgress) {
              await applyServerVersion(tx, progress, progressId, now);
            } else {
              const serverDate = new Date(progress.updatedAt || new Date(0).toISOString()).getTime();
              const localDate = new Date(localProgress.updatedAt).getTime();
              if (serverDate >= localDate) await applyServerVersion(tx, progress, progressId, now);
              else await SyncBase.addToQueue(tx as any, { entityType: EntityType.LESSON_PROGRESS, entityId: localProgress.lessonId, action: 'update', payload: { ...localProgress, id: progressId } });
            }
            const shouldPruneSchedules = Array.isArray(progress.reviewSchedules) || Boolean(progress.isDeleted);
            if (Array.isArray(progress.reviewSchedules) && progress.reviewSchedules.length > 0) {
              for (const review of progress.reviewSchedules) {
                const reviewId = review.id || Crypto.randomUUID();
                await tx.insert(schema.reviewSchedules).values({ id: reviewId, lessonProgressId: progressId, reviewRound: review.reviewRound, dueDate: review.dueDate, completed: review.completed, completedDate: review.completedDate, createdAt: review.createdAt || now, updatedAt: now, lastSyncedAt: now }).onConflictDoUpdate({
                  target: schema.reviewSchedules.id,
                  set: { lessonProgressId: progressId, reviewRound: review.reviewRound, completed: review.completed, completedDate: review.completedDate, dueDate: review.dueDate, updatedAt: now, lastSyncedAt: now, isDeleted: Boolean(review.isDeleted), deletedAt: review.deletedAt ?? null },
                });
              }
            }
            if (shouldPruneSchedules) {
              const remoteReviewIds = new Set((progress.reviewSchedules ?? []).map((review) => review.id).filter(Boolean));
              const localActiveSchedules = await tx.query.reviewSchedules.findMany({ columns: { id: true }, where: and(eq(schema.reviewSchedules.lessonProgressId, progressId), eq(schema.reviewSchedules.isDeleted, false)) });
              const candidateIds = localActiveSchedules.map((item) => item.id).filter((id) => !remoteReviewIds.has(id));
              if (candidateIds.length > 0) {
                const dirtyReviewIds = await SyncBase.getEntityDirtyIds(tx as any, candidateIds, EntityType.REVIEW_SCHEDULE);
                const pruneIds = candidateIds.filter((id) => !dirtyReviewIds.has(id));
                if (pruneIds.length > 0) await tx.update(schema.reviewSchedules).set({ isDeleted: true, deletedAt: now, updatedAt: now, lastSyncedAt: now }).where(inArray(schema.reviewSchedules.id, pruneIds));
              }
            }
          }
        }
      });
    },
  };
}
