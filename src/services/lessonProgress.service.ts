import { lessonProgressApi } from '@/api/lessonProgress';
import { createLessonProgressRepository } from '@/repositories/lessonProgress.repo';
import { LessonProgress } from '@/types/lesson';

/**
 * Get lesson progress with automatic sync
 * Two-way sync: fetch from backend and merge with local
 */
export async function getProgress(lessonId: string): Promise<LessonProgress | null> {
  const repo = createLessonProgressRepository();

  try {
    // Attempt to fetch from backend
    const remoteProgress = await lessonProgressApi.getProgress(lessonId);

    // Merge into local DB (conflict resolution handled in repository)
    if (remoteProgress) {
      await repo.upsertMany([remoteProgress]);
    }
  } catch (error) {
    // Network error or offline: fall through to local data
    console.warn('Failed to sync progress from backend:', error);
  }

  // Always return local data as source of truth (offline-first)
  return await repo.getLessonProgress(lessonId);
}

/**
 * Initialize lesson progress for a user
 */
export async function initLessonProgress(
  userId: string,
  lessonId: string
): Promise<LessonProgress> {
  const repo = createLessonProgressRepository();
  return await repo.initLessonProgress(userId, lessonId);
}

/**
 * Ensure learning mode is properly initialized with review schedules
 */
export async function ensureLearningInitialized(
  userId: string,
  progress: LessonProgress
): Promise<void> {
  const repo = createLessonProgressRepository();
  return await repo.ensureLearningInitialized(userId, progress);
}

/**
 * Save progress locally and queue for sync
 * Offline-first: writes locally immediately, sync happens asynchronously
 */
export async function saveProgress(progress: LessonProgress): Promise<void> {
  const repo = createLessonProgressRepository();
  return await repo.saveProgress(progress);
}

/**
 * Delete progress (soft delete, queues for sync)
 */
export async function deleteProgress(lessonId: string): Promise<void> {
  const repo = createLessonProgressRepository();
  return await repo.delete(lessonId);
}
