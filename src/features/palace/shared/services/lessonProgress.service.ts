import { lessonProgressApi } from '@/features/palace/shared/api/lessonProgress.api';
import { createLessonProgressRepository } from '@/features/palace/shared/repositories/lessonProgress.repository';
import type { LessonProgress } from '@/features/palace/shared/types/lesson.types';

export async function getProgress(lessonId: string): Promise<LessonProgress | null> {
  const repo = createLessonProgressRepository();
  try {
    const remoteProgress = await lessonProgressApi.getProgress(lessonId);
    if (remoteProgress) await repo.upsertMany([remoteProgress]);
  } catch (error: any) {
    if (error?.response?.status !== 404) console.warn('Failed to sync progress from backend:', error);
  }
  return repo.getLessonProgress(lessonId);
}

export async function initLessonProgress(lessonId: string): Promise<LessonProgress> {
  return createLessonProgressRepository().initLessonProgress(lessonId);
}

export async function ensureLearningInitialized(progress: LessonProgress): Promise<void> {
  return createLessonProgressRepository().ensureLearningInitialized(progress);
}

export async function saveProgress(progress: LessonProgress): Promise<void> {
  return createLessonProgressRepository().saveProgress(progress);
}

export async function deleteProgress(lessonId: string): Promise<void> {
  return createLessonProgressRepository().delete(lessonId);
}
