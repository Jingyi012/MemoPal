import { lessonProgressApi } from '@/features/palace/shared/api/lessonProgress.api';
import type { LessonProgress } from '@/features/palace/shared/types/lesson.types';
import * as Crypto from 'expo-crypto';

export async function getProgress(lessonId: string): Promise<LessonProgress | null> {
  try {
    return await lessonProgressApi.getProgress(lessonId);
  } catch (error: any) {
    const status = error?.statusCode ?? error?.response?.status;
    if (status === 404) return null;
    throw error;
  }
}

export async function initLessonProgress(lessonId: string): Promise<LessonProgress> {
  const now = new Date().toISOString();
  return lessonProgressApi.updateProgress({
    id: Crypto.randomUUID(),
    lessonId,
    firstCompletedDate: null,
    masteryLevel: 'new',
    totalReviews: 0,
    xpEarned: 0,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    reviewSchedules: [],
  });
}

export async function ensureLearningInitialized(progress: LessonProgress): Promise<void> {
  if (progress.masteryLevel !== 'learning' || progress.reviewSchedules?.length > 0) return;

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setUTCDate(dueDate.getUTCDate() + 1);
  await lessonProgressApi.updateProgress({
    ...progress,
    reviewSchedules: [
      {
        id: Crypto.randomUUID(),
        lessonProgressId: progress.id,
        reviewRound: 1,
        dueDate: dueDate.toISOString(),
        completed: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        isDeleted: false,
      },
    ],
  });
}

export async function saveProgress(progress: LessonProgress): Promise<void> {
  await lessonProgressApi.updateProgress({ ...progress, updatedAt: new Date().toISOString() });
}

export async function deleteProgress(lessonId: string): Promise<void> {
  const progress = await getProgress(lessonId);
  if (!progress) return;
  const now = new Date().toISOString();
  await lessonProgressApi.updateProgress({
    ...progress,
    isDeleted: true,
    deletedAt: now,
    updatedAt: now,
  });
}
