import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Lesson, LessonDetails } from '@/types/lesson';
import { and, asc, eq, inArray } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

/**
 * LessonRepository - Local database operations only
 * Handles CRUD operations for lessons with offline-first support
 * No business logic or direct API calls
 */
interface LessonRepository {
  getAllByPalace(palaceId: string): Promise<Lesson[]>;
  getDetails(lessonId: string): Promise<LessonDetails | null>;
  getById(id: string): Promise<Lesson | null>;
  save(lesson: Partial<Lesson>): Promise<string>;
  upsertMany(serverLessons: Lesson[]): Promise<void>;
  delete(id: string): Promise<void>;
}

export function createLessonRepository(): LessonRepository {
  return {
    /**
     * Get all lessons for a palace (non-deleted only)
     */
    async getAllByPalace(palaceId: string): Promise<Lesson[]> {
      return (await db.query.lessons.findMany({
        where: and(eq(schema.lessons.palaceId, palaceId), eq(schema.lessons.isDeleted, false)),
        with: {
          progress: true,
        },
        orderBy: [asc(schema.lessons.createdAt)],
      })) as unknown as Lesson[];
    },

    /**
     * Get lesson with details (words, progress)
     */
    async getDetails(lessonId: string): Promise<LessonDetails | null> {
      const result = await db.query.lessons.findFirst({
        where: eq(schema.lessons.id, lessonId),
        with: {
          progress: true,
          words: true,
        },
      });

      return result as unknown as LessonDetails;
    },

    /**
     * Get lesson by ID
     */
    async getById(id: string): Promise<Lesson | null> {
      return (await db.query.lessons.findFirst({
        where: eq(schema.lessons.id, id),
      })) as unknown as Lesson | null;
    },

    /**
     * Create or update lesson (offline-first, queues for sync)
     * Creates locally immediately and queues for backend sync
     */
    async save(lesson: Partial<Lesson>): Promise<string> {
      const isNew = !lesson.id;
      const id = lesson.id || Crypto.randomUUID();
      const now = new Date().toISOString();
      const action = isNew ? 'create' : 'update';

      await db.transaction(async (tx) => {
        await tx
          .insert(schema.lessons)
          .values({
            id,
            palaceId: lesson.palaceId!,
            title: lesson.title!,
            description: lesson.description,
            category: lesson.category,
            privacy: lesson.privacy,
            wordCount: lesson.wordCount ?? 0,
            isCustom: lesson.isCustom ?? false,
            isPremium: lesson.isPremium ?? false,
            isLocked: lesson.isLocked ?? false,
            createdAt: lesson.createdAt ?? now,
            updatedAt: now,
            lastSyncedAt: null,
            isDeleted: false,
          })
          .onConflictDoUpdate({
            target: schema.lessons.id,
            set: {
              title: lesson.title,
              description: lesson.description,
              category: lesson.category,
              privacy: lesson.privacy,
              wordCount: lesson.wordCount,
              updatedAt: now,
            },
          });

        // Queue for backend sync
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LESSON,
          entityId: id,
          action,
          payload: { ...lesson, id, updatedAt: now },
        });
      });

      return id;
    },

    /**
     * Upsert lessons from server with conflict resolution
     * Uses last-write-wins strategy based on updatedAt timestamp
     * Skips dirty (locally modified) items to prevent overwriting local changes
     */
    async upsertMany(serverLessons: Lesson[]): Promise<void> {
      if (serverLessons.length === 0) return;

      const ids = serverLessons.map((l) => l.id);
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        // Get local records for conflict resolution
        const localRecords = await tx.query.lessons.findMany({
          where: inArray(schema.lessons.id, ids),
        });
        const localMap = new Map(localRecords.map((r) => [r.id, r]));

        // Get dirty IDs (locally modified, queued for sync)
        const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.LESSON);

        for (const serverItem of serverLessons) {
          const localItem = localMap.get(serverItem.id);
          const isDirty = dirtyIds.has(serverItem.id);

          // If not dirty and (new or server is newer): apply server version
          if (
            !isDirty &&
            (!localItem || new Date(serverItem.updatedAt) > new Date(localItem.updatedAt))
          ) {
            await tx
              .insert(schema.lessons)
              .values({
                ...serverItem,
                isCustom: Boolean(serverItem.isCustom),
                isPremium: Boolean(serverItem.isPremium),
                isLocked: Boolean(serverItem.isLocked),
                isDeleted: Boolean(serverItem.isDeleted),
                lastSyncedAt: now,
              })
              .onConflictDoUpdate({
                target: schema.lessons.id,
                set: {
                  ...serverItem,
                  lastSyncedAt: now,
                },
              });
          } else if (
            !isDirty &&
            localItem &&
            new Date(localItem.updatedAt) > new Date(serverItem.updatedAt)
          ) {
            // Local is newer but not dirty: queue for sync
            await SyncBase.addToQueue(tx as any, {
              entityType: EntityType.LESSON,
              entityId: localItem.id,
              action: 'update',
              payload: { ...localItem },
            });
          }
        }
      });
    },

    /**
     * Delete lesson (soft delete, queues for sync)
     * Marks as deleted locally and queues for backend deletion
     */
    async delete(id: string): Promise<void> {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        const record = await tx.query.lessons.findFirst({
          columns: { lastSyncedAt: true },
          where: eq(schema.lessons.id, id),
        });

        if (!record) return;

        // Soft delete
        await tx
          .update(schema.lessons)
          .set({
            isDeleted: true,
            deletedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.lessons.id, id));

        // Queue for backend sync
        if (record.lastSyncedAt) {
          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.LESSON,
            entityId: id,
            action: 'delete',
          });
        } else {
          // If never synced, remove from queue
          await SyncBase.removePendingSyncs(tx as any, id);
        }
      });
    },
  };
}
