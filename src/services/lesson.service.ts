import { lessonApi } from '@/api/lesson';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { createLessonRepository } from '@/repositories/lesson.repo';
import { createPalaceRepository } from '@/repositories/palace.repo';
import { Lesson, LessonDetails } from '@/types/lesson';
import { eq } from 'drizzle-orm';

const repo = createLessonRepository();
const palaceRepo = createPalaceRepository();

/**
 * Get lessons by palace with two-way sync
 * Strategy: Download remote updates, merge with local using conflict resolution
 */
export async function getLessonsByPalace(palaceId: string): Promise<Lesson[]> {
  const localPalace = await palaceRepo.getById(palaceId);
  const isUnsyncedCustomPalace = localPalace?.isCustom === true && !localPalace.lastSyncedAt;

  if (isUnsyncedCustomPalace) {
    return await repo.getAllByPalace(palaceId);
  }

  try {
    // Attempt to fetch lessons for this palace from backend
    const remoteLessons = await lessonApi.getByPalaceId(palaceId);
    // Merge remote data with local (respects dirty state) and prune stale official lessons.
    await repo.upsertMany(remoteLessons ?? [], {
      pruneMissingOfficial: true,
      palaceId,
    });
  } catch (error) {
    console.warn(`Failed to sync lessons for palace ${palaceId}, using local data:`, error);
  }

  // Return local data (offline-first)
  return await repo.getAllByPalace(palaceId);
}

/**
 * Get lesson by ID with details and sync
 */
export async function getLessonById(id: string): Promise<LessonDetails | null> {
  try {
    const remoteLesson = await lessonApi.getById(id);

    if (remoteLesson) {
      // Update local copy with server data
      await repo.upsertMany([remoteLesson]);
    }
  } catch (error) {
    console.warn('Failed to sync lesson details, using local data:', error);
  }

  // Return local data (offline-first)
  return await repo.getDetails(id);
}

/**
 * Create lesson (offline-first)
 * 1. Create locally and queue for sync
 * 2. Background: sync queue processor sends to backend
 */
export async function createLesson(form: Partial<Lesson>): Promise<string> {
  try {
    // Create locally first (offline-first)
    const id = await repo.save(form);
    return id;
  } catch (error) {
    console.error('Failed to create lesson locally:', error);
    throw error;
  }
}

/**
 * Update lesson (offline-first)
 * 1. Update locally and queue for sync
 * 2. Background: sync queue processor sends to backend
 */
export async function updateLesson(id: string, form: Partial<Lesson>): Promise<void> {
  try {
    // Update locally first (offline-first)
    await repo.save({ ...form, id });
  } catch (error) {
    console.error('Failed to update lesson locally:', error);
    throw error;
  }
}

/**
 * Delete lesson (offline-first, soft delete)
 * 1. Soft delete locally and queue for sync
 * 2. Background: sync queue processor sends to backend
 */
export async function deleteLesson(id: string): Promise<void> {
  try {
    // Delete locally first (offline-first)
    await repo.delete(id);
  } catch (error) {
    console.error('Failed to delete lesson locally:', error);
    throw error;
  }
}

/**
 * Sync all pending lesson changes to backend
 * Called by SyncManager when network is available
 */
export async function syncPendingChanges(): Promise<void> {
  try {
    // Get all pending lesson changes
    const queue = await db.query.syncQueue.findMany({
      where: eq(schema.syncQueue.entityType, EntityType.LESSON),
    });

    for (const item of queue) {
      try {
        if (item.action === 'create') {
          const payload = item.payload ? JSON.parse(item.payload) : {};
          await lessonApi.create(payload as Lesson);
          // On success, sync processor removes from queue and marks as synced
        } else if (item.action === 'update') {
          const payload = item.payload ? JSON.parse(item.payload) : {};
          await lessonApi.update(payload as Lesson);
          // On success, sync processor removes from queue and marks as synced
        } else if (item.action === 'delete') {
          await lessonApi.delete(item.entityId);
          // On success, sync processor removes from queue
        }
      } catch (error) {
        console.error(`Failed to sync lesson ${item.entityId}:`, error);
        // Retry on next sync
      }
    }
  } catch (error) {
    console.error('Error during lesson sync:', error);
  }
}
