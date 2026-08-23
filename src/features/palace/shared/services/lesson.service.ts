import { lessonApi } from '@/features/palace/shared/api/lesson.api';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { createLessonRepository } from '@/features/palace/shared/repositories/lesson.repository';
import { createPalaceRepository } from '@/features/palace/shared/repositories/palace.repository';
import type { Lesson, LessonDetails } from '@/features/palace/shared/types/lesson.types';
import { eq } from 'drizzle-orm';

const repo = createLessonRepository();
const palaceRepo = createPalaceRepository();

export async function getLessonsByPalace(palaceId: string): Promise<Lesson[]> {
  const localPalace = await palaceRepo.getById(palaceId);
  const isUnsyncedCustomPalace = localPalace?.isCustom === true && !localPalace.lastSyncedAt;
  if (isUnsyncedCustomPalace) return repo.getAllByPalace(palaceId);

  try {
    const remoteLessons = await lessonApi.getByPalaceId(palaceId);
    await repo.upsertMany(remoteLessons ?? [], { pruneMissingOfficial: true, palaceId });
  } catch (error) {
    console.warn(`Failed to sync lessons for palace ${palaceId}, using local data:`, error);
  }
  return repo.getAllByPalace(palaceId);
}

export async function getLessonById(id: string): Promise<LessonDetails | null> {
  try {
    const remoteLesson = await lessonApi.getById(id);
    if (remoteLesson) await repo.upsertMany([remoteLesson]);
  } catch (error) {
    console.warn('Failed to sync lesson details, using local data:', error);
  }
  return repo.getDetails(id);
}

export async function createLesson(form: Partial<Lesson>): Promise<string> {
  try {
    return await repo.save(form);
  } catch (error) {
    console.error('Failed to create lesson locally:', error);
    throw error;
  }
}

export async function updateLesson(id: string, form: Partial<Lesson>): Promise<void> {
  try {
    await repo.save({ ...form, id });
  } catch (error) {
    console.error('Failed to update lesson locally:', error);
    throw error;
  }
}

export async function deleteLesson(id: string): Promise<void> {
  try {
    await repo.delete(id);
  } catch (error) {
    console.error('Failed to delete lesson locally:', error);
    throw error;
  }
}

export async function syncPendingChanges(): Promise<void> {
  try {
    const queue = await db.query.syncQueue.findMany({
      where: eq(schema.syncQueue.entityType, EntityType.LESSON),
    });

    for (const item of queue) {
      try {
        if (item.action === 'create') {
          await lessonApi.create(item.payload ? JSON.parse(item.payload) as Lesson : {} as Lesson);
        } else if (item.action === 'update') {
          await lessonApi.update(item.payload ? JSON.parse(item.payload) as Lesson : {} as Lesson);
        } else if (item.action === 'delete') {
          await lessonApi.delete(item.entityId);
        }
      } catch (error) {
        console.error(`Failed to sync lesson ${item.entityId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error during lesson sync:', error);
  }
}
