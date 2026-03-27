import { db as defaultDb } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { badgeApi } from '@/api/badge';
import { lessonApi } from '@/api/lesson';
import { lessonProgressApi } from '@/api/lessonProgress';
import { milestoneApi } from '@/api/milestone';
import { locationApi } from '@/api/location';
import { notificationApi } from '@/api/notification';
import { palaceApi } from '@/api/palace';
import { reviewApi } from '@/api/review';
import { userStatsApi } from '@/api/userStats';
import { xpEventApi } from '@/api/xpEvent';
import { wordApi } from '@/api/word';
import { SyncBase } from '@/services/sync/sync.base';
import NetInfo from '@react-native-community/netinfo';
import { eq } from 'drizzle-orm';

// Map EntityType strings to Drizzle Table Schemas
const tableMap: Record<string, any> = {
  [EntityType.PALACE]: schema.palaces,
  [EntityType.LESSON]: schema.lessons,
  [EntityType.WORD]: schema.words,
  [EntityType.LESSON_PROGRESS]: schema.lessonProgress,
  [EntityType.LOCATION]: schema.locations,
  [EntityType.NOTIFICATION]: schema.notifications,
  [EntityType.XP_EVENT]: schema.xpEvents,
  [EntityType.USER_STATS]: schema.userStats,
  [EntityType.BADGE]: schema.badges,
  [EntityType.MILESTONE]: schema.milestones,
  [EntityType.REVIEW_SCHEDULE]: schema.reviewSchedules,
};

let isProcessing = false;

function parseSyncPayload(raw: string | null | undefined) {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Invalid sync payload', error);
    return null;
  }
}

async function hydrateXpEventPayload(db: typeof defaultDb, item: any, payload: any) {
  const hasRequiredFields =
    payload &&
    typeof payload.id === 'string' &&
    typeof payload.sourceType === 'string' &&
    typeof payload.xpAmount === 'number' &&
    typeof payload.clientEventId === 'string' &&
    payload.clientEventId.length > 0;

  if (hasRequiredFields) {
    return payload;
  }

  const localEvent = await db.query.xpEvents.findFirst({
    where: (event, { eq }) => eq(event.id, item.entityId),
  });

  if (!localEvent) {
    return null;
  }

  return {
    id: localEvent.id,
    sourceType: localEvent.sourceType,
    sourceId: localEvent.sourceId ?? undefined,
    xpAmount: localEvent.xpAmount,
    clientEventId: localEvent.clientEventId,
    createdAt: localEvent.createdAt,
    updatedAt: localEvent.updatedAt,
    lastSyncedAt: localEvent.lastSyncedAt,
    isDeleted: localEvent.isDeleted,
    deletedAt: localEvent.deletedAt,
  };
}

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

    // 2. Sort by dependency order: Parent before Child
    // Priority: PALACE (1) → LOCATION (2) → LESSON (3) → WORD (4), LESSON_PROGRESS (5) → Others (6)
    const syncDependencyOrder: Record<string, number> = {
      [EntityType.PALACE]: 1,
      [EntityType.LOCATION]: 2,
      [EntityType.LESSON]: 3,
      [EntityType.WORD]: 4,
      [EntityType.LESSON_PROGRESS]: 5,
      // Others get default priority 6
    };

    const sortedItems = queueItems.sort((a, b) => {
      const priorityA = syncDependencyOrder[a.entityType] ?? 6;
      const priorityB = syncDependencyOrder[b.entityType] ?? 6;
      if (priorityA !== priorityB) return priorityA - priorityB;
      // Same priority: maintain original order
      return a.createdAt.localeCompare(b.createdAt);
    });

    const wordItems = sortedItems.filter((item) => item.entityType === EntityType.WORD);
    const otherItems = sortedItems.filter((item) => item.entityType !== EntityType.WORD);

    if (wordItems.length > 0) {
      try {
        const createItems = wordItems.filter((w) => w.action === 'create');
        const updateItems = wordItems.filter((w) => w.action === 'update');
        const deleteItems = wordItems.filter((w) => w.action === 'delete');

        if (createItems.length > 0) {
          const payloads = createItems
            .map((item) => parseSyncPayload(item.payload))
            .filter(Boolean);

          if (payloads.length > 0) {
            await wordApi.createBatch(payloads as any[]);
          }
        }

        if (updateItems.length > 0) {
          const payloads = updateItems
            .map((item) => parseSyncPayload(item.payload))
            .filter(Boolean);

          if (payloads.length > 0) {
            await wordApi.updateBatch(payloads as any[]);
          }
        }

        if (deleteItems.length > 0) {
          const ids = deleteItems.map((item) => item.entityId);
          await wordApi.deleteBatch(ids);
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
        let payload = parseSyncPayload(item.payload);
        let isSuccess = false;
        let syncEntityId = item.entityId;

        // 2. Process API Calls
        switch (item.entityType) {
          case EntityType.PALACE:
            if (item.action !== 'delete' && !payload) {
              console.warn('Missing payload for PALACE queue item', item.id);
              continue;
            }
            if (item.action === 'create') await palaceApi.create(payload);
            else if (item.action === 'update') await palaceApi.update(payload);
            else if (item.action === 'delete') await palaceApi.delete(item.entityId);
            else {
              console.warn('Unsupported action for PALACE', item.action);
              continue;
            }
            isSuccess = true;
            break;

          case EntityType.LESSON:
            if (item.action !== 'delete' && !payload) {
              console.warn('Missing payload for LESSON queue item', item.id);
              continue;
            }
            if (item.action === 'create') await lessonApi.create(payload);
            else if (item.action === 'update') await lessonApi.update(payload);
            else if (item.action === 'delete') await lessonApi.delete(item.entityId);
            else {
              console.warn('Unsupported action for LESSON', item.action);
              continue;
            }
            isSuccess = true;
            break;

          case EntityType.LOCATION:
            if (item.action !== 'delete' && !payload) {
              console.warn('Missing payload for LOCATION queue item', item.id);
              continue;
            }
            if (item.action === 'create') await locationApi.create(payload);
            else if (item.action === 'update') await locationApi.update(payload);
            else if (item.action === 'delete') await locationApi.delete(item.entityId);
            else {
              console.warn('Unsupported action for LOCATION', item.action);
              continue;
            }
            isSuccess = true;
            break;

          case EntityType.NOTIFICATION:
            if (item.action !== 'delete' && !payload) {
              console.warn('Missing payload for NOTIFICATION queue item', item.id);
              continue;
            }
            if (item.action === 'create') await notificationApi.create(payload);
            else if (item.action === 'update') await notificationApi.update(item.entityId, payload);
            else if (item.action === 'delete') await notificationApi.delete(item.entityId);
            else {
              console.warn('Unsupported action for NOTIFICATION', item.action);
              continue;
            }
            isSuccess = true;
            break;

          case EntityType.LESSON_PROGRESS:
            if (!payload?.lessonId) {
              const localProgress = await db.query.lessonProgress.findFirst({
                where: (progress, { or, eq }) =>
                  or(eq(progress.lessonId, item.entityId), eq(progress.id, item.entityId)),
                with: {
                  reviewSchedules: {
                    orderBy: (entries, { asc }) => [asc(entries.reviewRound)],
                  },
                },
              });

              if (!localProgress) {
                console.warn('Missing lessonId for LESSON_PROGRESS queue item', item.id);
                continue;
              }

              payload = localProgress;
            }

            try {
              await lessonProgressApi.updateProgress(payload);
              syncEntityId = payload.lessonId;
              isSuccess = true;
            } catch (error: any) {
              // If lesson not found on backend, skip it (lesson might not be synced yet)
              // It will be retried in next sync cycle after lesson is created
              if (
                error?.response?.status === 404 &&
                error?.response?.data?.message?.includes('Lesson')
              ) {
                console.warn(
                  `Skipping LESSON_PROGRESS for orphaned lesson ${payload.lessonId}, will retry in next cycle`
                );
                continue;
              }
              throw error;
            }
            break;

          case EntityType.XP_EVENT:
            if (item.action !== 'create') {
              console.warn('Unsupported action for XP_EVENT', item.action);
              continue;
            }
            payload = await hydrateXpEventPayload(db, item, payload);
            if (!payload?.clientEventId) {
              console.warn('Missing payload for XP_EVENT queue item', item.id);
              continue;
            }
            await xpEventApi.create(payload);
            isSuccess = true;
            break;

          case EntityType.USER_STATS:
            if (item.action !== 'update') {
              console.warn('Unsupported action for USER_STATS', item.action);
              continue;
            }
            if (!payload) {
              console.warn('Missing payload for USER_STATS queue item', item.id);
              continue;
            }
            await userStatsApi.updateStats(payload);
            isSuccess = true;
            break;

          case EntityType.BADGE:
            if (item.action !== 'create' && item.action !== 'update') {
              console.warn('Unsupported action for BADGE', item.action);
              continue;
            }
            await badgeApi.awardBadge(item.entityId);
            isSuccess = true;
            break;

          case EntityType.MILESTONE:
            if (item.action !== 'create' && item.action !== 'update') {
              console.warn('Unsupported action for MILESTONE', item.action);
              continue;
            }
            await milestoneApi.awardMilestone(item.entityId);
            isSuccess = true;
            break;

          case EntityType.REVIEW_SCHEDULE:
            if (item.action === 'create' || item.action === 'delete') {
              console.warn('No backend create/delete endpoint for REVIEW_SCHEDULE', item.action);
              await db.delete(schema.syncQueue).where(eq(schema.syncQueue.id, item.id));
              continue;
            }

            if (!payload) {
              console.warn('Missing payload for REVIEW_SCHEDULE queue item', item.id);
              continue;
            }

            if (payload.completed === true) {
              await reviewApi.complete(item.entityId, payload.correctCount, payload.totalCount);
            } else {
              await reviewApi.update({ ...payload, id: item.entityId });
            }

            isSuccess = true;
            break;

          default:
            console.warn('Unknown entityType', item.entityType);
            continue;
        }

        // 3. Post-Process Local DB (Transaction)
        if (isSuccess) {
          await db.transaction(async (tx) => {
            const dirtyCheckEntityId =
              item.entityType === EntityType.LESSON_PROGRESS ? syncEntityId : item.entityId;

            if (item.action !== 'delete') {
              // Check if the user made NEW changes while we were talking to the server
              const stillDirty = await SyncBase.isDirty(tx, dirtyCheckEntityId);

              if (!stillDirty) {
                const targetTable = tableMap[item.entityType];
                if (targetTable) {
                  if (item.entityType === EntityType.LESSON_PROGRESS) {
                    await tx
                      .update(targetTable)
                      .set({ lastSyncedAt: new Date().toISOString() })
                      .where(eq(schema.lessonProgress.lessonId, syncEntityId));
                  } else if (item.entityType === EntityType.USER_STATS) {
                    await tx
                      .update(targetTable)
                      .set({ lastSyncedAt: new Date().toISOString() })
                      .where(eq(schema.userStats.userId, syncEntityId));
                  } else {
                    await tx
                      .update(targetTable)
                      .set({ lastSyncedAt: new Date().toISOString() })
                      .where(eq(targetTable.id, syncEntityId));
                  }
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
