import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/core/sync/sync.base';
import type { Word } from '@/features/palace/shared/types/lesson.types';
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

interface WordRepository {
  getAllByLesson(lessonId: string): Promise<Word[]>;
  syncLessonWords(lessonId: string, incomingWords: Partial<Word>[]): Promise<void>;
  batchDelete(ids: string[]): Promise<void>;
  upsertMany(serverWords: Word[], options?: { pruneMissingSynced?: boolean; lessonId?: string }): Promise<void>;
  save(word: Partial<Word>): Promise<string>;
  batchSave(words: Partial<Word>[]): Promise<string[]>;
  delete(id: string): Promise<void>;
}

export function createWordRepository(): WordRepository {
  const applyServerVersion = async (tx: any, item: Word, syncTime: string): Promise<void> => {
    await tx.insert(schema.words).values({ ...item, lastSyncedAt: syncTime, isDeleted: Boolean(item.isDeleted) }).onConflictDoUpdate({
      target: schema.words.id, set: { ...item, lastSyncedAt: syncTime },
    });
  };

  return {
    async getAllByLesson(lessonId: string): Promise<Word[]> {
      const rows = await db.select({ word: schema.words }).from(schema.words)
        .leftJoin(schema.locations, eq(schema.locations.id, schema.words.locationId))
        .where(and(eq(schema.words.lessonId, lessonId), eq(schema.words.isDeleted, false)))
        .orderBy(asc(schema.locations.position), asc(schema.words.createdAt));
      return rows.map((row) => row.word) as Word[];
    },
    async syncLessonWords(lessonId: string, incomingWords: Partial<Word>[]): Promise<void> {
      const existingWords = await db.query.words.findMany({ where: eq(schema.words.lessonId, lessonId) });
      const incomingIds = new Set(incomingWords.map((word) => word.id).filter(Boolean));
      const idsToDelete = existingWords.filter((word) => !incomingIds.has(word.id)).map((word) => word.id);
      if (idsToDelete.length > 0) await this.batchDelete(idsToDelete);
      await this.batchSave(incomingWords);
    },
    async batchDelete(ids: string[]): Promise<void> {
      if (ids.length === 0) return;
      await db.transaction(async (tx) => {
        const records = await tx.query.words.findMany({ columns: { id: true, lastSyncedAt: true }, where: inArray(schema.words.id, ids) });
        const syncedIds = records.filter((record) => record.lastSyncedAt).map((record) => record.id);
        const unsyncedIds = records.filter((record) => !record.lastSyncedAt).map((record) => record.id);
        if (syncedIds.length > 0) {
          await SyncBase.addManyToQueue(tx as any, syncedIds.map((id) => ({ entityType: EntityType.WORD, entityId: id, action: 'delete' as const, payload: null as any })));
        }
        for (const id of unsyncedIds) await SyncBase.removePendingSyncs(tx as any, id);
        const now = new Date().toISOString();
        await tx.update(schema.words).set({ isDeleted: true, deletedAt: now, updatedAt: now }).where(inArray(schema.words.id, ids));
      });
    },
    async upsertMany(serverWords: Word[], options?: { pruneMissingSynced?: boolean; lessonId?: string }): Promise<void> {
      const ids = serverWords.map((word) => word.id);
      const now = new Date().toISOString();
      const pruneMissingSynced = options?.pruneMissingSynced ?? false;
      const pruneLessonId = options?.lessonId;
      await db.transaction(async (tx) => {
        const localRecords = ids.length > 0 ? await tx.query.words.findMany({ where: inArray(schema.words.id, ids) }) : [];
        const localMap = new Map(localRecords.map((record) => [record.id, record]));
        const dirtyIds = ids.length > 0 ? await SyncBase.getEntityDirtyIds(tx as any, ids, EntityType.WORD) : new Set<string>();
        for (const serverItem of serverWords) {
          const localItem = localMap.get(serverItem.id);
          const isDirty = dirtyIds.has(serverItem.id);
          if (isDirty) continue;
          if (!localItem) {
            await applyServerVersion(tx, serverItem, now);
          } else {
            const serverDate = new Date(serverItem.updatedAt).getTime();
            const localDate = new Date(localItem.updatedAt).getTime();
            if (serverDate > localDate) await applyServerVersion(tx, serverItem, now);
            else if (localDate > serverDate) await SyncBase.addToQueue(tx as any, { entityType: EntityType.WORD, entityId: localItem.id, action: 'update', payload: { ...localItem } });
          }
        }
        if (pruneMissingSynced && pruneLessonId) {
          const dirtyQueueRows = await tx.query.syncQueue.findMany({ columns: { entityId: true }, where: eq(schema.syncQueue.entityType, EntityType.WORD) });
          const dirtyWordIds = new Set(dirtyQueueRows.map((row) => row.entityId));
          const syncedWordsInLesson = await tx.query.words.findMany({
            columns: { id: true }, where: and(eq(schema.words.lessonId, pruneLessonId), eq(schema.words.isDeleted, false), isNotNull(schema.words.lastSyncedAt)),
          });
          const serverIdSet = new Set(ids);
          const staleIds = syncedWordsInLesson.map((row) => row.id).filter((id) => !serverIdSet.has(id) && !dirtyWordIds.has(id));
          if (staleIds.length > 0) await tx.update(schema.words).set({ isDeleted: true, deletedAt: now, updatedAt: now, lastSyncedAt: now }).where(inArray(schema.words.id, staleIds));
        }
      });
    },
    async save(word: Partial<Word>): Promise<string> {
      const requestedId = word.id;
      const id = requestedId || Crypto.randomUUID();
      const now = new Date().toISOString();
      await db.transaction(async (tx) => {
        const existing = requestedId ? await tx.query.words.findFirst({ where: eq(schema.words.id, requestedId) }) : null;
        if (existing) {
          const merged: Partial<Word> = { ...(existing as Word), ...word, id: existing.id, createdAt: existing.createdAt, updatedAt: now, lastSyncedAt: null };
          if (!merged.lessonId || !merged.text || !merged.locationId) throw new Error('Word lessonId, text and locationId are required.');
          await tx.update(schema.words).set({
            lessonId: merged.lessonId, text: merged.text,
            meaning: Object.prototype.hasOwnProperty.call(merged, 'meaning') ? (merged.meaning ?? null) : existing.meaning,
            locationId: merged.locationId, isDeleted: merged.isDeleted ?? false,
            deletedAt: Object.prototype.hasOwnProperty.call(merged, 'deletedAt') ? (merged.deletedAt ?? null) : existing.deletedAt,
            updatedAt: now, lastSyncedAt: null,
          }).where(eq(schema.words.id, existing.id));
          await SyncBase.addToQueue(tx as any, { entityType: EntityType.WORD, entityId: existing.id, action: 'update', payload: { ...merged, id: existing.id, updatedAt: now, lastSyncedAt: null } });
          return;
        }
        if (!word.lessonId || !word.text || !word.locationId) throw new Error('Word lessonId, text and locationId are required.');
        const createPayload: Partial<Word> = { id, lessonId: word.lessonId, text: word.text, meaning: word.meaning, locationId: word.locationId, createdAt: word.createdAt || now, updatedAt: now, lastSyncedAt: null, isDeleted: false, deletedAt: null };
        await tx.insert(schema.words).values({ id, lessonId: createPayload.lessonId!, text: createPayload.text!, meaning: createPayload.meaning, locationId: createPayload.locationId!, createdAt: createPayload.createdAt || now, updatedAt: now, lastSyncedAt: null, isDeleted: false, deletedAt: null });
        await SyncBase.addToQueue(tx as any, { entityType: EntityType.WORD, entityId: id, action: 'create', payload: { ...createPayload, id } });
      });
      return id;
    },
    async batchSave(words: Partial<Word>[]): Promise<string[]> {
      if (words.length === 0) return [];
      const now = new Date().toISOString();
      const ids: string[] = [];
      await db.transaction(async (tx) => {
        const queuePayloads: any[] = [];
        const requestedIds = words.map((word) => word.id).filter(Boolean) as string[];
        const existingRows = requestedIds.length > 0 ? await tx.query.words.findMany({ where: inArray(schema.words.id, requestedIds) }) : [];
        const existingMap = new Map(existingRows.map((row) => [row.id, row]));
        for (const word of words) {
          const existing = word.id ? existingMap.get(word.id) : null;
          const isNew = !existing;
          const id = existing?.id || word.id || Crypto.randomUUID();
          ids.push(id);
          const action = isNew ? 'create' : 'update';
          if (existing) {
            const merged: Partial<Word> = { ...(existing as Word), ...word, id: existing.id, createdAt: existing.createdAt, updatedAt: now, lastSyncedAt: null };
            if (!merged.lessonId || !merged.text || !merged.locationId) throw new Error('Word lessonId, text and locationId are required.');
            await tx.update(schema.words).set({
              lessonId: merged.lessonId, text: merged.text,
              meaning: Object.prototype.hasOwnProperty.call(merged, 'meaning') ? (merged.meaning ?? null) : existing.meaning,
              locationId: merged.locationId, isDeleted: merged.isDeleted ?? false,
              deletedAt: Object.prototype.hasOwnProperty.call(merged, 'deletedAt') ? (merged.deletedAt ?? null) : existing.deletedAt,
              updatedAt: now, lastSyncedAt: null,
            }).where(eq(schema.words.id, existing.id));
            queuePayloads.push({ entityType: EntityType.WORD, entityId: existing.id, action, payload: { ...merged, id: existing.id, updatedAt: now, lastSyncedAt: null } });
            continue;
          }
          if (!word.lessonId || !word.text || !word.locationId) throw new Error('Word lessonId, text and locationId are required.');
          const createPayload: Partial<Word> = { id, lessonId: word.lessonId, text: word.text, meaning: word.meaning, locationId: word.locationId, createdAt: word.createdAt || now, updatedAt: now, lastSyncedAt: null, isDeleted: false, deletedAt: null };
          await tx.insert(schema.words).values({ id, lessonId: createPayload.lessonId!, text: createPayload.text!, meaning: createPayload.meaning, locationId: createPayload.locationId!, createdAt: createPayload.createdAt || now, updatedAt: now, lastSyncedAt: null, isDeleted: false, deletedAt: null });
          queuePayloads.push({ entityType: EntityType.WORD, entityId: id, action, payload: { ...createPayload, id } });
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
