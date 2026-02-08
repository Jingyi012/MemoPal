import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Lesson, LessonDetails } from '@/types/lesson';
import { and, asc, eq, inArray } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export function useLessonRepository() {
  const getAllByPalace = async (palaceId: string): Promise<Lesson[]> => {
    return (await db.query.lessons.findMany({
      where: and(eq(schema.lessons.palaceId, palaceId), eq(schema.lessons.isDeleted, false)),
      with: {
        progress: true,
      },
      orderBy: [asc(schema.lessons.createdAt)],
    })) as unknown as Lesson[];
  };

  const getDetails = async (lessonId: string): Promise<LessonDetails | null> => {
    // get lesson + words in one logical flow
    const result = await db.query.lessons.findFirst({
      where: eq(schema.lessons.id, lessonId),
      with: {
        progress: true,
        words: true,
      },
    });

    return result as unknown as LessonDetails;
  };

  const save = async (lesson: Partial<Lesson>) => {
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
          lastSyncedAt: lesson.lastSyncedAt,
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

      // Pass the transaction 'tx' to SyncBase if it supports it
      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.LESSON,
        entityId: id,
        action: action,
        payload: { ...lesson, id, updatedAt: now },
      });
    });

    return id;
  };

  const upsertMany = async (serverLessons: Lesson[]) => {
    if (serverLessons.length === 0) return;

    const ids = serverLessons.map((l) => l.id);

    await db.transaction(async (tx) => {
      // 1. Get local records
      const localRecords = await tx.query.lessons.findMany({
        where: inArray(schema.lessons.id, ids),
      });
      const localMap = new Map(localRecords.map((r) => [r.id, r]));

      // 2. Get dirty IDs
      const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.LESSON);

      for (const serverItem of serverLessons) {
        const localItem = localMap.get(serverItem.id);
        const isDirty = dirtyIds.has(serverItem.id);

        if (
          !localItem ||
          (!isDirty && new Date(serverItem.updatedAt) > new Date(localItem.updatedAt))
        ) {
          // New or Server is newer
          await applyServerVersion(tx, serverItem);
        } else if (!isDirty && new Date(localItem.updatedAt) > new Date(serverItem.updatedAt)) {
          // Local is newer but not dirty (Stale server data)
          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.LESSON,
            entityId: localItem.id,
            action: 'update',
            payload: { ...localItem },
          });
        }
      }
    });
  };

  // Internal helper using the transaction object
  async function applyServerVersion(tx: any, item: Lesson) {
    await tx
      .insert(schema.lessons)
      .values({
        ...item,
        // Ensure booleans for Drizzle (SQLite maps 0/1)
        isCustom: Boolean(item.isCustom),
        isPremium: Boolean(item.isPremium),
        isLocked: Boolean(item.isLocked),
        isDeleted: Boolean(item.isDeleted),
      })
      .onConflictDoUpdate({
        target: schema.lessons.id,
        set: { ...item },
      });
  }

  const remove = async (id: string) => {
    await db.transaction(async (tx) => {
      const record = await tx.query.lessons.findFirst({
        columns: { lastSyncedAt: true },
        where: eq(schema.lessons.id, id),
      });

      if (!record) return;

      if (record.lastSyncedAt) {
        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.LESSON,
          entityId: id,
          action: 'delete',
          payload: null,
        });
      } else {
        await SyncBase.removePendingSyncs(tx as any, id);
      }

      await tx.delete(schema.lessons).where(eq(schema.lessons.id, id));
    });
  };

  return { getAllByPalace, getDetails, save, upsertMany, remove };
}
