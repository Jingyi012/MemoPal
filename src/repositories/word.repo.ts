import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Word } from '@/types/lesson';
import { and, asc, eq, inArray } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export function useWordRepository() {
  /**
   * Fetch all words for a lesson (excluding deleted ones)
   */
  const getAllByLesson = async (lessonId: string): Promise<Word[]> => {
    return (await db.query.words.findMany({
      where: and(eq(schema.words.lessonId, lessonId), eq(schema.words.isDeleted, false)),
      orderBy: [asc(schema.words.text)],
    })) as Word[];
  };

  /**
   * syncLessonWords: The key method for Lesson Updates.
   * Compares the incoming words from the UI with what's in the DB.
   * 1. Deletes words that are missing from the incoming list.
   * 2. Upserts (Create/Update) the rest using batchSave.
   */
  const syncLessonWords = async (lessonId: string, incomingWords: Partial<Word>[]) => {
    // 1. Get current words in DB for this lesson
    const existingWords = await db.query.words.findMany({
      where: eq(schema.words.lessonId, lessonId),
    });

    // 2. Identify IDs that are no longer present in the UI
    const incomingIds = new Set(incomingWords.map((w) => w.id).filter(Boolean));
    const idsToDelete = existingWords.filter((ew) => !incomingIds.has(ew.id)).map((ew) => ew.id);

    // 3. Perform batch deletion if needed
    if (idsToDelete.length > 0) {
      await batchRemove(idsToDelete);
    }

    // 4. Perform batch save for new/updated words
    return await batchSave(incomingWords);
  };

  /**
   * Batch version of the remove logic
   */
  const batchRemove = async (ids: string[]) => {
    if (ids.length === 0) return;

    await db.transaction(async (tx) => {
      // Find which items have already been synced to server
      const records = await tx.query.words.findMany({
        columns: { id: true, lastSyncedAt: true },
        where: inArray(schema.words.id, ids),
      });

      const syncedIds = records.filter((r) => r.lastSyncedAt).map((r) => r.id);
      const unsyncedIds = records.filter((r) => !r.lastSyncedAt).map((r) => r.id);

      // A. For synced items: Queue a 'delete' action
      if (syncedIds.length > 0) {
        const queuePayloads = syncedIds.map((id) => ({
          entityType: EntityType.WORD,
          entityId: id,
          action: 'delete' as const,
          payload: '',
        }));
        await SyncBase.addManyToQueue(tx as any, queuePayloads);
      }

      // B. For unsynced items: Just wipe them from the sync queue (they never went to server)
      for (const id of unsyncedIds) {
        await SyncBase.removePendingSyncs(tx as any, id);
      }

      // Final: Remove from local DB
      await tx.delete(schema.words).where(inArray(schema.words.id, ids));
    });
  };

  /**
   * Batch sync words from server with conflict resolution
   */
  const upsertMany = async (serverWords: Word[]) => {
    if (serverWords.length === 0) return;

    const ids = serverWords.map((w) => w.id);

    await db.transaction(async (tx) => {
      const localRecords = await tx.query.words.findMany({
        where: inArray(schema.words.id, ids),
      });
      const localMap = new Map(localRecords.map((r) => [r.id, r]));
      const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.WORD);
      const now = new Date().toISOString();

      for (const serverItem of serverWords) {
        const localItem = localMap.get(serverItem.id);
        const isDirty = dirtyIds.has(serverItem.id);

        if (!localItem) {
          await applyServerVersion(tx, serverItem, now);
        } else if (isDirty) {
          continue;
        } else {
          const serverDate = new Date(serverItem.updatedAt).getTime();
          const localDate = new Date(localItem.updatedAt).getTime();

          if (serverDate > localDate) {
            await applyServerVersion(tx, serverItem, now);
          } else if (localDate > serverDate) {
            await SyncBase.addToQueue(tx as any, {
              entityType: EntityType.WORD,
              entityId: localItem.id,
              action: 'update',
              payload: { ...localItem },
            });
          }
        }
      }
    });
  };

  async function applyServerVersion(tx: any, item: Word, syncTime: string) {
    await tx
      .insert(schema.words)
      .values({
        ...item,
        lastSyncedAt: syncTime,
        isDeleted: Boolean(item.isDeleted),
      })
      .onConflictDoUpdate({
        target: schema.words.id,
        set: { ...item, lastSyncedAt: syncTime },
      });
  }

  const save = async (word: Partial<Word>) => {
    const isNew = !word.id;
    const id = word.id || Crypto.randomUUID();
    const now = new Date().toISOString();
    const action = isNew ? 'create' : 'update';

    await db.transaction(async (tx) => {
      await tx
        .insert(schema.words)
        .values({
          id,
          lessonId: word.lessonId!,
          text: word.text!,
          meaning: word.meaning,
          locationId: word.locationId!,
          createdAt: word.createdAt || now,
          updatedAt: now,
          lastSyncedAt: word.lastSyncedAt || null,
          isDeleted: false,
        })
        .onConflictDoUpdate({
          target: schema.words.id,
          set: {
            text: word.text,
            meaning: word.meaning,
            locationId: word.locationId,
            updatedAt: now,
          },
        });

      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.WORD,
        entityId: id,
        action: action,
        payload: { ...word, id, updatedAt: now },
      });
    });

    return id;
  };

  const batchSave = async (words: Partial<Word>[]) => {
    if (words.length === 0) return [];
    const now = new Date().toISOString();
    const ids: string[] = [];

    await db.transaction(async (tx) => {
      const queuePayloads: any[] = [];

      for (const word of words) {
        const isNew = !word.id;
        const id = word.id || Crypto.randomUUID();
        ids.push(id);
        const action = isNew ? 'create' : 'update';

        await tx
          .insert(schema.words)
          .values({
            id,
            lessonId: word.lessonId!,
            text: word.text!,
            meaning: word.meaning,
            locationId: word.locationId!,
            createdAt: word.createdAt || now,
            updatedAt: now,
            lastSyncedAt: word.lastSyncedAt || null,
            isDeleted: false,
          })
          .onConflictDoUpdate({
            target: schema.words.id,
            set: {
              text: word.text,
              meaning: word.meaning,
              locationId: word.locationId,
              updatedAt: now,
            },
          });

        queuePayloads.push({
          entityType: EntityType.WORD,
          entityId: id,
          action: action,
          payload: { ...word, id, updatedAt: now },
        });
      }

      await SyncBase.addManyToQueue(tx as any, queuePayloads);
    });

    return ids;
  };

  const remove = async (id: string) => {
    await batchRemove([id]);
  };

  return {
    getAllByLesson,
    upsertMany,
    save,
    batchSave,
    syncLessonWords,
    batchRemove,
    remove,
  };
}
