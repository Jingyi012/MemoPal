import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/core/sync/sync.base';
import type { Lesson, LessonDetails } from '@/features/palace/shared/types/lesson.types';
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { createLessonProgressRepository } from '@/features/palace/shared/repositories/lessonProgress.repository';

interface LessonRepository {
  getAllByPalace(palaceId: string): Promise<Lesson[]>;
  getDetails(lessonId: string): Promise<LessonDetails | null>;
  getById(id: string): Promise<Lesson | null>;
  save(lesson: Partial<Lesson>): Promise<string>;
  upsertMany(serverLessons: Lesson[], options?: { pruneMissingOfficial?: boolean; palaceId?: string }): Promise<void>;
  delete(id: string): Promise<void>;
}

export function createLessonRepository(): LessonRepository {
  return {
    async getAllByPalace(palaceId: string): Promise<Lesson[]> {
      return (await db.query.lessons.findMany({
        where: and(eq(schema.lessons.palaceId, palaceId), eq(schema.lessons.isDeleted, false)),
        with: { progress: true },
        orderBy: [asc(schema.lessons.createdAt)],
      })) as unknown as Lesson[];
    },
    async getDetails(lessonId: string): Promise<LessonDetails | null> {
      const result = await db.query.lessons.findFirst({
        where: eq(schema.lessons.id, lessonId),
        with: { progress: true, words: true },
      });
      return result as unknown as LessonDetails;
    },
    async getById(id: string): Promise<Lesson | null> {
      return (await db.query.lessons.findFirst({ where: eq(schema.lessons.id, id) })) as unknown as Lesson | null;
    },
    async save(lesson: Partial<Lesson>): Promise<string> {
      const requestedId = lesson.id;
      const id = requestedId || Crypto.randomUUID();
      const now = new Date().toISOString();
      await db.transaction(async (tx) => {
        const existing = requestedId
          ? await tx.query.lessons.findFirst({ where: eq(schema.lessons.id, requestedId) })
          : null;
        if (existing) {
          const mergedLesson: Partial<Lesson> = {
            id: existing.id,
            palaceId: lesson.palaceId ?? existing.palaceId,
            title: lesson.title ?? existing.title,
            description: Object.prototype.hasOwnProperty.call(lesson, 'description') ? lesson.description : existing.description,
            category: Object.prototype.hasOwnProperty.call(lesson, 'category') ? lesson.category : existing.category,
            privacy: lesson.privacy ?? existing.privacy,
            wordCount: typeof lesson.wordCount === 'number' ? lesson.wordCount : (existing.wordCount ?? 0),
            isCustom: typeof lesson.isCustom === 'boolean' ? lesson.isCustom : Boolean(existing.isCustom),
            isPremium: typeof lesson.isPremium === 'boolean' ? lesson.isPremium : Boolean(existing.isPremium),
            isLocked: typeof lesson.isLocked === 'boolean' ? lesson.isLocked : Boolean(existing.isLocked),
            isDeleted: typeof lesson.isDeleted === 'boolean' ? lesson.isDeleted : Boolean(existing.isDeleted),
            deletedAt: Object.prototype.hasOwnProperty.call(lesson, 'deletedAt') ? lesson.deletedAt : existing.deletedAt,
            createdAt: existing.createdAt, updatedAt: now, lastSyncedAt: null,
          };
          await tx.update(schema.lessons).set({
            palaceId: mergedLesson.palaceId!, title: mergedLesson.title!, description: mergedLesson.description,
            category: mergedLesson.category, privacy: mergedLesson.privacy ?? 'private',
            wordCount: mergedLesson.wordCount ?? 0, isCustom: mergedLesson.isCustom ?? false,
            isPremium: mergedLesson.isPremium ?? false, isLocked: mergedLesson.isLocked ?? false,
            isDeleted: mergedLesson.isDeleted ?? false, deletedAt: mergedLesson.deletedAt ?? null,
            updatedAt: now, lastSyncedAt: null,
          }).where(eq(schema.lessons.id, existing.id));
          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.LESSON, entityId: id, action: 'update',
            payload: {
              ...mergedLesson,
              ...(Object.prototype.hasOwnProperty.call(lesson, 'tag') ? { tag: lesson.tag } : {}),
              ...(Object.prototype.hasOwnProperty.call(lesson, 'completed') ? { completed: lesson.completed } : {}),
              ...(Object.prototype.hasOwnProperty.call(lesson, 'createdBy') ? { createdBy: lesson.createdBy } : {}),
            },
          });
          return;
        }
        if (!lesson.palaceId || !lesson.title) throw new Error('Lesson palaceId and title are required.');
        const createPayload: Partial<Lesson> = {
          id, palaceId: lesson.palaceId, title: lesson.title, description: lesson.description,
          category: lesson.category, privacy: lesson.privacy ?? 'private', wordCount: lesson.wordCount ?? 0,
          isCustom: lesson.isCustom ?? false, isPremium: lesson.isPremium ?? false,
          isLocked: lesson.isLocked ?? false, completed: lesson.completed ?? false, createdBy: lesson.createdBy,
          createdAt: lesson.createdAt ?? now, updatedAt: now, isDeleted: false, deletedAt: null,
        };
        await tx.insert(schema.lessons).values({
          id, palaceId: createPayload.palaceId!, title: createPayload.title!, description: createPayload.description,
          category: createPayload.category, privacy: createPayload.privacy ?? 'private', wordCount: createPayload.wordCount ?? 0,
          isCustom: createPayload.isCustom ?? false, isPremium: createPayload.isPremium ?? false,
          isLocked: createPayload.isLocked ?? false, createdAt: createPayload.createdAt ?? now,
          updatedAt: now, lastSyncedAt: null, isDeleted: false, deletedAt: null,
        });
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LESSON, entityId: id, action: 'create',
          payload: { ...createPayload, ...(Object.prototype.hasOwnProperty.call(lesson, 'tag') ? { tag: lesson.tag } : {}) },
        });
      });
      return id;
    },
    async upsertMany(serverLessons: Lesson[], options?: { pruneMissingOfficial?: boolean; palaceId?: string }): Promise<void> {
      const progressRepo = createLessonProgressRepository();
      const ids = serverLessons.map((lesson) => lesson.id);
      const now = new Date().toISOString();
      const pruneMissingOfficial = options?.pruneMissingOfficial ?? false;
      const prunePalaceId = options?.palaceId;
      await db.transaction(async (tx) => {
        const localRecords = ids.length > 0
          ? await tx.query.lessons.findMany({ where: inArray(schema.lessons.id, ids) }) : [];
        const localMap = new Map(localRecords.map((record) => [record.id, record]));
        const dirtyIds = ids.length > 0
          ? await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.LESSON) : new Set<string>();
        for (const serverItem of serverLessons) {
          const localItem = localMap.get(serverItem.id);
          const isDirty = dirtyIds.has(serverItem.id);
          if (!isDirty && (!localItem || new Date(serverItem.updatedAt) > new Date(localItem.updatedAt))) {
            await tx.insert(schema.lessons).values({
              ...serverItem, isCustom: Boolean(serverItem.isCustom), isPremium: Boolean(serverItem.isPremium),
              isLocked: Boolean(serverItem.isLocked), isDeleted: Boolean(serverItem.isDeleted), lastSyncedAt: now,
            }).onConflictDoUpdate({ target: schema.lessons.id, set: { ...serverItem, lastSyncedAt: now } });
          } else if (!isDirty && localItem && new Date(localItem.updatedAt) > new Date(serverItem.updatedAt)) {
            await SyncBase.addToQueue(tx as any, {
              entityType: EntityType.LESSON, entityId: localItem.id, action: 'update', payload: { ...localItem },
            });
          }
        }
        if (pruneMissingOfficial && prunePalaceId) {
          const dirtyQueueRows = await tx.query.syncQueue.findMany({
            columns: { entityId: true }, where: eq(schema.syncQueue.entityType, EntityType.LESSON),
          });
          const dirtyLessonIds = new Set(dirtyQueueRows.map((row) => row.entityId));
          const syncedOfficialLessons = await tx.query.lessons.findMany({
            columns: { id: true }, where: and(eq(schema.lessons.palaceId, prunePalaceId), eq(schema.lessons.isDeleted, false), isNotNull(schema.lessons.lastSyncedAt)),
          });
          const serverIdSet = new Set(ids);
          const staleIds = syncedOfficialLessons.map((row) => row.id).filter((id) => !serverIdSet.has(id) && !dirtyLessonIds.has(id));
          if (staleIds.length > 0) {
            await tx.update(schema.lessons).set({ isDeleted: true, deletedAt: now, updatedAt: now, lastSyncedAt: now }).where(inArray(schema.lessons.id, staleIds));
          }
        }
      });
      const embeddedProgresses = serverLessons.map((lesson) => lesson.progress).filter(
        (progress): progress is NonNullable<Lesson['progress']> => Boolean(progress)
      );
      if (embeddedProgresses.length > 0) await progressRepo.upsertMany(embeddedProgresses);
    },
    async delete(id: string): Promise<void> {
      const now = new Date().toISOString();
      await db.transaction(async (tx) => {
        const record = await tx.query.lessons.findFirst({ columns: { lastSyncedAt: true }, where: eq(schema.lessons.id, id) });
        if (!record) return;
        await tx.update(schema.lessons).set({ isDeleted: true, deletedAt: now, updatedAt: now }).where(eq(schema.lessons.id, id));
        if (record.lastSyncedAt) {
          await SyncBase.addToQueue(tx as any, { entityType: EntityType.LESSON, entityId: id, action: 'delete' });
        } else {
          await SyncBase.removePendingSyncs(tx as any, id);
        }
      });
    },
  };
}
