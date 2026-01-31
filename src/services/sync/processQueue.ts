import { db as defaultDb } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { LessonService } from '@/services/lesson.service';
import { LessonProgressService } from '@/services/lessonProgress.service';
import { PalaceService } from '@/services/palace.service';
import { SyncBase } from '@/services/sync/sync.base';
import { WordService } from '@/services/word.service';
import NetInfo from '@react-native-community/netinfo';
import { eq } from 'drizzle-orm';

// Map EntityType strings to Drizzle Table Schemas
const tableMap: Record<string, any> = {
  [EntityType.PALACE]: schema.palaces,
  [EntityType.LESSON]: schema.lessons,
  [EntityType.WORD]: schema.words,
  [EntityType.LESSON_PROGRESS]: schema.lessonProgress,
};

let isProcessing = false;

export async function processQueue(db = defaultDb) {
  if (isProcessing) return;

  const network = await NetInfo.fetch();
  if (!network.isConnected || !network.isInternetReachable) return;

  isProcessing = true;

  try {
    // 1. Fetch items using Drizzle Relational API
    const queueItems = await db.query.syncQueue.findMany({
      orderBy: (q, { asc }) => [asc(q.createdAt)],
    });

    if (queueItems.length === 0) return;

    const wordItems = queueItems.filter((item) => item.entityType === EntityType.WORD);
    const otherItems = queueItems.filter((item) => item.entityType !== EntityType.WORD);

    if (wordItems.length > 0) {
      try {
        const createItems = wordItems.filter((w) => w.action === 'create');
        const updateItems = wordItems.filter((w) => w.action === 'update');
        const deleteItems = wordItems.filter((w) => w.action === 'delete');

        if (createItems.length > 0) {
          const payloads = createItems.map((item) =>
            item.payload ? JSON.parse(item.payload) : null
          );
          await WordService.createWordsBatch(payloads);
        }

        if (updateItems.length > 0) {
          const payloads = updateItems.map((item) =>
            item.payload ? JSON.parse(item.payload) : null
          );
          await WordService.updateWordsBatch(payloads);
        }

        if (deleteItems.length > 0) {
          const ids = deleteItems.map((item) => item.entityId);
          await WordService.deleteWordsBatch(ids);
        }
        // Post-process Words: apply the "dirty" check for each item in the batch
        for (const item of wordItems) {
          await db.transaction(async (tx) => {
            if (item.action !== 'delete') {
              const stillDirty = await SyncBase.isDirty(tx, item.entityId);
              if (!stillDirty) {
                await tx
                  .update(schema.words)
                  .set({ lastSyncedAt: new Date().toISOString() })
                  .where(eq(schema.words.id, item.entityId));
              }
            }
            await tx.delete(schema.syncQueue).where(eq(schema.syncQueue.id, item.id));
          });
        }
      } catch (error) {
        console.error('Word batch sync failed:', error);
      }
    }

    for (const item of otherItems) {
      try {
        const payload = item.payload ? JSON.parse(item.payload) : null;
        let isSuccess = false;

        // 2. Process API Calls
        switch (item.entityType) {
          case EntityType.PALACE:
            if (item.action === 'create') await PalaceService.createPalace(payload);
            else if (item.action === 'update')
              await PalaceService.updatePalace(item.entityId, payload);
            else if (item.action === 'delete') await PalaceService.deletePalace(item.entityId);
            isSuccess = true;
            break;

          case EntityType.LESSON:
            if (item.action === 'create') await LessonService.createLesson(payload);
            else if (item.action === 'update')
              await LessonService.updateLesson(item.entityId, payload);
            else if (item.action === 'delete') await LessonService.deleteLesson(item.entityId);
            isSuccess = true;
            break;

          // case EntityType.WORD:
          //   if (item.action === 'create') await WordService.createWord(payload);
          //   else if (item.action === 'update') await WordService.updateWord(item.entityId, payload);
          //   else if (item.action === 'delete') await WordService.deleteWord(item.entityId);
          //   isSuccess = true;
          //   break;

          case EntityType.LESSON_PROGRESS:
            await LessonProgressService.updateProgress(payload);
            isSuccess = true;
            break;

          default:
            console.warn('Unknown entityType', item.entityType);
            // Delete corrupt item from queue
            await db.delete(schema.syncQueue).where(eq(schema.syncQueue.id, item.id));
            continue;
        }

        // 3. Post-Process Local DB (Transaction)
        if (isSuccess) {
          await db.transaction(async (tx) => {
            if (item.action !== 'delete') {
              // Check if the user made NEW changes while we were talking to the server
              const stillDirty = await SyncBase.isDirty(tx, item.entityId);

              if (!stillDirty) {
                const targetTable = tableMap[item.entityType];
                if (targetTable) {
                  await tx
                    .update(targetTable)
                    .set({ lastSyncedAt: new Date().toISOString() })
                    .where(eq(targetTable.id, item.entityId));
                }
              }
            }

            // Remove specifically this queue item by its primary key ID
            await tx.delete(schema.syncQueue).where(eq(schema.syncQueue.id, item.id));
          });
        }
      } catch (error: any) {
        if (item.action === 'delete' && error?.response?.status === 404) {
          await db.delete(schema.syncQueue).where(eq(schema.syncQueue.id, item.id));
          continue;
        }

        console.error(`Sync failed for item ${item.id}:`, error);
        break; // Stop queue processing on network error
      }
    }
  } finally {
    isProcessing = false;
  }
}
