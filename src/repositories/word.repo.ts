import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { Word } from '@/types/lesson';
import { and, asc, eq, inArray } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

/**
 * WordRepository - Local database operations only
 * Handles CRUD operations for words with offline-first support
 * No business logic or direct API calls
 */
interface WordRepository {
  getAllByLesson(lessonId: string): Promise<Word[]>;
  syncLessonWords(lessonId: string, incomingWords: Partial<Word>[]): Promise<void>;
  batchDelete(ids: string[]): Promise<void>;
  upsertMany(serverWords: Word[]): Promise<void>;
  save(word: Partial<Word>): Promise<string>;
  batchSave(words: Partial<Word>[]): Promise<string[]>;
  delete(id: string): Promise<void>;
}

export function createWordRepository(): WordRepository {
  const applyServerVersion = async (tx: any, item: Word, syncTime: string): Promise<void> => {
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
  };

  return {
    async getAllByLesson(lessonId: string): Promise<Word[]> {
      return (await db.query.words.findMany({
        where: and(eq(schema.words.lessonId, lessonId), eq(schema.words.isDeleted, false)),
        orderBy: [asc(schema.words.text)],
      })) as Word[];
    },

    async syncLessonWords(lessonId: string, incomingWords: Partial<Word>[]): Promise<void> {
      const existingWords = await db.query.words.findMany({
        where: eq(schema.words.lessonId, lessonId),
      });

      const incomingIds = new Set(incomingWords.map((w) => w.id).filter(Boolean));
      const idsToDelete = existingWords.filter((ew) => !incomingIds.has(ew.id)).map((ew) => ew.id);

      if (idsToDelete.length > 0) {
        await this.batchDelete(idsToDelete);
      }

      await this.batchSave(incomingWords);
    },

    async batchDelete(ids: string[]): Promise<void> {
      if (ids.length === 0) return;

      await db.transaction(async (tx) => {
        const records = await tx.query.words.findMany({
          columns: { id: true, lastSyncedAt: true },
          where: inArray(schema.words.id, ids),
        });

        const syncedIds = records.filter((r) => r.lastSyncedAt).map((r) => r.id);
        const unsyncedIds = records.filter((r) => !r.lastSyncedAt).map((r) => r.id);

        if (syncedIds.length > 0) {
          const queuePayloads = syncedIds.map((id) => ({
            entityType: EntityType.WORD,
            entityId: id,
            action: 'delete' as const,
            payload: null as any,
          }));
          await SyncBase.addManyToQueue(tx as any, queuePayloads);
        }

        for (const id of unsyncedIds) {
          await SyncBase.removePendingSyncs(tx as any, id);
        }

        const now = new Date().toISOString();
        await tx
          .update(schema.words)
          .set({ isDeleted: true, deletedAt: now, updatedAt: now })
          .where(inArray(schema.words.id, ids));
      });
    },

    async upsertMany(serverWords: Word[]): Promise<void> {
      if (serverWords.length === 0) return;

      const ids = serverWords.map((w) => w.id);
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        const localRecords = await tx.query.words.findMany({
          where: inArray(schema.words.id, ids),
        });
        const localMap = new Map(localRecords.map((r) => [r.id, r]));
        const dirtyIds = await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.WORD);

        for (const serverItem of serverWords) {
          const localItem = localMap.get(serverItem.id);
          const isDirty = dirtyIds.has(serverItem.id);

          if (isDirty) continue;

          if (!localItem) {
            await applyServerVersion(tx, serverItem, now);
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
    },

    async save(word: Partial<Word>): Promise<string> {
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
            lastSyncedAt: null,
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
          action,
          payload: { ...word, id, updatedAt: now },
        });
      });

      return id;
    },

    async batchSave(words: Partial<Word>[]): Promise<string[]> {
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
              lastSyncedAt: null,
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
            action,
            payload: { ...word, id, updatedAt: now },
          });
        }

        await SyncBase.addManyToQueue(tx as any, queuePayloads);
      });

      return ids;
    },

    async delete(id: string): Promise<void> {
      await this.batchDelete([id]);
    },
  };
}
