import { db as defaultDb } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { badgeApi } from '@/api/badge';
import { lessonApi } from '@/api/lesson';
import { lessonProgressApi } from '@/api/lessonProgress';
import { mediaApi } from '@/api/media';
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
import { and, eq, inArray } from 'drizzle-orm';

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

function isLocalDeviceUri(value?: string | null): value is string {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith('file://') ||
    normalized.startsWith('content://') ||
    normalized.startsWith('ph://') ||
    normalized.startsWith('assets-library://')
  );
}

function getFileNameFromUri(uri: string, fallback: string) {
  const [pathPart] = uri.split('?');
  const fileName = pathPart.split('/').filter(Boolean).pop();
  return fileName || fallback;
}

function getHttpStatus(error: any): number | null {
  const status = error?.response?.status;
  return typeof status === 'number' ? status : null;
}

function isNonRetriableSyncError(error: any): boolean {
  const status = getHttpStatus(error);
  return status !== null && [400, 403, 404, 409, 422].includes(status);
}

function getSyncErrorMessage(error: any): string {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.title ??
    error?.message ??
    'Unknown error'
  );
}

async function rollbackFailedLessonCreate(db: typeof defaultDb, lessonId: string) {
  await db.transaction(async (tx) => {
    const localWords = await tx.query.words.findMany({
      columns: { id: true },
      where: eq(schema.words.lessonId, lessonId),
    });

    if (localWords.length > 0) {
      const wordIds = localWords.map((entry) => entry.id);
      await tx
        .delete(schema.syncQueue)
        .where(
          and(
            eq(schema.syncQueue.entityType, EntityType.WORD),
            inArray(schema.syncQueue.entityId, wordIds)
          )
        );
    }

    await tx
      .delete(schema.syncQueue)
      .where(
        and(
          eq(schema.syncQueue.entityType, EntityType.LESSON_PROGRESS),
          eq(schema.syncQueue.entityId, lessonId)
        )
      );

    await tx
      .delete(schema.syncQueue)
      .where(
        and(eq(schema.syncQueue.entityType, EntityType.LESSON), eq(schema.syncQueue.entityId, lessonId))
      );

    await tx.delete(schema.lessons).where(eq(schema.lessons.id, lessonId));
  });
}

async function hydratePalacePayload(db: typeof defaultDb, item: any, payload: any) {
  const localPalace = await db.query.palaces.findFirst({
    where: (palace, { eq }) => eq(palace.id, item.entityId),
  });

  if (!localPalace) return payload;

  return {
    id: localPalace.id,
    name: payload?.name ?? localPalace.name,
    description: payload?.description ?? localPalace.description,
    locationsCount: payload?.locationsCount ?? localPalace.locationsCount,
    thumbnail: payload?.thumbnail ?? localPalace.thumbnail,
    isLocked: payload?.isLocked ?? localPalace.isLocked,
    unlockedAt: payload?.unlockedAt ?? localPalace.unlockedAt,
    level: payload?.level ?? localPalace.level,
    isPremium: payload?.isPremium ?? localPalace.isPremium,
    isCustom: payload?.isCustom ?? localPalace.isCustom,
    createdBy: payload?.createdBy ?? localPalace.createdBy,
    createdAt: payload?.createdAt ?? localPalace.createdAt,
    updatedAt: payload?.updatedAt ?? localPalace.updatedAt,
    isDeleted: payload?.isDeleted ?? localPalace.isDeleted,
    deletedAt: payload?.deletedAt ?? localPalace.deletedAt,
  };
}

async function hydrateLocationPayload(db: typeof defaultDb, item: any, payload: any) {
  const localLocation = await db.query.locations.findFirst({
    where: (location, { eq }) => eq(location.id, item.entityId),
  });

  if (!localLocation) return payload;

  return {
    id: localLocation.id,
    palaceId: payload?.palaceId ?? localLocation.palaceId,
    position: payload?.position ?? localLocation.position,
    name: payload?.name ?? localLocation.name,
    description: payload?.description ?? localLocation.description,
    imageUrl: payload?.imageUrl ?? localLocation.imageUrl,
    createdAt: payload?.createdAt ?? localLocation.createdAt,
    updatedAt: payload?.updatedAt ?? localLocation.updatedAt,
    isDeleted: payload?.isDeleted ?? localLocation.isDeleted,
    deletedAt: payload?.deletedAt ?? localLocation.deletedAt,
  };
}

async function resolvePalaceThumbnailUpload(db: typeof defaultDb, item: any, payload: any) {
  const thumbnail = payload?.thumbnail;
  if (!isLocalDeviceUri(thumbnail)) {
    return payload;
  }

  const uploadedUrl = await mediaApi.uploadImage(
    thumbnail,
    getFileNameFromUri(thumbnail, `${item.entityId}-thumbnail.jpg`),
    'palaces'
  );
  const updatedPayload = { ...payload, thumbnail: uploadedUrl };

  await db.transaction(async (tx) => {
    await tx
      .update(schema.palaces)
      .set({ thumbnail: uploadedUrl, updatedAt: new Date().toISOString() })
      .where(eq(schema.palaces.id, item.entityId));

    await tx
      .update(schema.syncQueue)
      .set({ payload: JSON.stringify(updatedPayload) })
      .where(eq(schema.syncQueue.id, item.id));
  });

  return updatedPayload;
}

async function resolveLocationImageUpload(db: typeof defaultDb, item: any, payload: any) {
  const imageUrl = payload?.imageUrl;
  if (!isLocalDeviceUri(imageUrl)) {
    return payload;
  }

  const uploadedUrl = await mediaApi.uploadImage(
    imageUrl,
    getFileNameFromUri(imageUrl, `${item.entityId}.jpg`),
    'locations'
  );
  const updatedPayload = { ...payload, imageUrl: uploadedUrl };

  await db.transaction(async (tx) => {
    await tx
      .update(schema.locations)
      .set({ imageUrl: uploadedUrl, updatedAt: new Date().toISOString() })
      .where(eq(schema.locations.id, item.entityId));

    await tx
      .update(schema.syncQueue)
      .set({ payload: JSON.stringify(updatedPayload) })
      .where(eq(schema.syncQueue.id, item.id));
  });

  return updatedPayload;
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

    if (__DEV__) {
      const preview = queueItems.slice(0, 20).map((item) => ({
        id: item.id,
        entityType: item.entityType,
        entityId: item.entityId,
        action: item.action,
        createdAt: item.createdAt,
      }));
      console.log('[SyncQueue] Pending items:', queueItems.length, preview);
    }

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

    const locationItems = sortedItems.filter((item) => item.entityType === EntityType.LOCATION);
    const wordItems = sortedItems.filter((item) => item.entityType === EntityType.WORD);
    const otherItems = sortedItems.filter(
      (item) => item.entityType !== EntityType.WORD && item.entityType !== EntityType.LOCATION
    );

    const processLocationQueue = async () => {
      if (locationItems.length === 0) return true;

      try {
        const createItems = locationItems.filter((item) => item.action === 'create');
        const updateItems = locationItems.filter((item) => item.action === 'update');
        const deleteItems = locationItems.filter((item) => item.action === 'delete');

        if (createItems.length > 0) {
          const payloads: any[] = [];
          for (const item of createItems) {
            let payload = parseSyncPayload(item.payload);
            if (!payload) continue;
            payload = await hydrateLocationPayload(db, item, payload);
            payload = await resolveLocationImageUpload(db, item, payload);
            payloads.push(payload);
          }

          if (payloads.length > 0) {
            await locationApi.createBatch(payloads);
          }
        }

        if (updateItems.length > 0) {
          const payloads: any[] = [];
          for (const item of updateItems) {
            let payload = parseSyncPayload(item.payload);
            if (!payload) continue;
            payload = await hydrateLocationPayload(db, item, payload);
            payload = await resolveLocationImageUpload(db, item, payload);
            payloads.push(payload);
          }

          if (payloads.length > 0) {
            await locationApi.updateBatch(payloads);
          }
        }

        if (deleteItems.length > 0) {
          await locationApi.deleteBatch(deleteItems.map((item) => item.entityId));
        }

        for (const item of locationItems) {
          await db.transaction(async (tx) => {
            if (item.action !== 'delete') {
              const stillDirty = await SyncBase.isDirty(tx, item.entityId);
              if (!stillDirty) {
                await tx
                  .update(schema.locations)
                  .set({ lastSyncedAt: new Date().toISOString() })
                  .where(eq(schema.locations.id, item.entityId));
              }
            }
            await tx.delete(schema.syncQueue).where(eq(schema.syncQueue.id, item.id));
          });
        }

        return true;
      } catch (error) {
        console.error('Location batch sync failed:', error);
        return false;
      }
    };

    const processWordQueue = async () => {
      if (wordItems.length === 0) return;

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
    };

    let canProcessWordQueue = true;

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
            if (item.action !== 'delete') {
              payload = await hydratePalacePayload(db, item, payload);
              payload = await resolvePalaceThumbnailUpload(db, item, payload);
            }
            if (item.action === 'create') await palaceApi.create(payload);
            else if (item.action === 'update') {
              try {
                await palaceApi.update(payload);
              } catch (error: any) {
                if (error?.response?.status === 404 && payload) {
                  // Recovery path for legacy queue rows wrongly tagged as update for new entities.
                  await palaceApi.create(payload);
                } else {
                  throw error;
                }
              }
            }
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
            if (item.action !== 'delete') {
              payload = await hydrateLocationPayload(db, item, payload);
              payload = await resolveLocationImageUpload(db, item, payload);
            }
            if (item.action === 'create') await locationApi.create(payload);
            else if (item.action === 'update') {
              try {
                await locationApi.update(payload);
              } catch (error: any) {
                if (error?.response?.status === 404 && payload) {
                  // Recovery path for legacy queue rows wrongly tagged as update for new entities.
                  await locationApi.create(payload);
                } else {
                  throw error;
                }
              }
            }
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

        if (isNonRetriableSyncError(error)) {
          const message = getSyncErrorMessage(error);
          console.warn(
            `[SyncQueue] Dropping non-retriable item ${item.id} (${item.entityType}:${item.action}) - ${message}`
          );

          if (item.entityType === EntityType.LESSON && item.action === 'create') {
            await rollbackFailedLessonCreate(db, item.entityId);
          } else {
            await db.delete(schema.syncQueue).where(eq(schema.syncQueue.id, item.id));
          }
          continue;
        }

        console.error(`Sync failed for item ${item.id}:`, error);
        canProcessWordQueue = false;
        break; // Stop queue processing on network error
      }
    }

    // Sync locations and words only after dependent entities (palaces, lessons)
    // have been processed in this cycle.
    if (canProcessWordQueue) {
      const locationBatchOk = await processLocationQueue();
      if (locationBatchOk) {
        await processWordQueue();
      }
    }
  } finally {
    isProcessing = false;
  }
}

export async function clearSyncQueueForDevelopment(db = defaultDb) {
  if (!__DEV__) {
    throw new Error('clearSyncQueueForDevelopment is only available in development.');
  }

  const pendingItems = await db.query.syncQueue.findMany({
    columns: { id: true },
  });

  if (pendingItems.length === 0) {
    return 0;
  }

  await db.delete(schema.syncQueue);
  console.log(`[SyncQueue] Cleared ${pendingItems.length} pending item(s) in development.`);

  return pendingItems.length;
}
