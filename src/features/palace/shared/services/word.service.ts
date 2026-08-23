import { wordApi } from '@/features/palace/shared/api/word.api';
import { createWordRepository } from '@/features/palace/shared/repositories/word.repository';
import type { Word } from '@/features/palace/shared/types/lesson.types';

export async function getWordsByLesson(lessonId: string): Promise<Word[]> {
  const repo = createWordRepository();
  try {
    const remoteWords = await wordApi.getByLessonId(lessonId);
    await repo.upsertMany(remoteWords ?? [], { pruneMissingSynced: true, lessonId });
  } catch (error) {
    console.warn(`Failed to sync words for lesson ${lessonId}, using local data:`, error);
  }
  return repo.getAllByLesson(lessonId);
}

export async function getWordById(id: string): Promise<Word | null> {
  const repo = createWordRepository();
  try {
    const remoteWord = await wordApi.getById(id);
    if (remoteWord) {
      await repo.upsertMany([remoteWord]);
      return remoteWord;
    }
  } catch (error) {
    console.warn('Failed to sync word, using local data:', error);
  }
  return null;
}

export async function syncLessonWords(lessonId: string, words: Partial<Word>[]): Promise<void> {
  try {
    await createWordRepository().syncLessonWords(lessonId, words);
  } catch (error) {
    console.error('Failed to sync lesson words locally:', error);
    throw error;
  }
}

export async function createWord(payload: Partial<Word>): Promise<string> {
  try {
    return await createWordRepository().save(payload);
  } catch (error) {
    console.error('Failed to create word locally:', error);
    throw error;
  }
}

export async function createWordsBatch(payload: Partial<Word>[]): Promise<string[]> {
  try {
    return await createWordRepository().batchSave(payload);
  } catch (error) {
    console.error('Failed to batch create words:', error);
    throw error;
  }
}

export async function updateWord(id: string, payload: Partial<Word>): Promise<void> {
  try {
    await createWordRepository().save({ ...payload, id });
  } catch (error) {
    console.error('Failed to update word:', error);
    throw error;
  }
}

export async function updateWordsBatch(payload: Partial<Word>[]): Promise<void> {
  try {
    await createWordRepository().batchSave(payload);
  } catch (error) {
    console.error('Failed to batch update words:', error);
    throw error;
  }
}

export async function deleteWord(id: string): Promise<void> {
  try {
    await createWordRepository().delete(id);
  } catch (error) {
    console.error('Failed to delete word:', error);
    throw error;
  }
}

export async function deleteWordsBatch(ids: string[]): Promise<void> {
  try {
    await createWordRepository().batchDelete(ids);
  } catch (error) {
    console.error('Failed to batch delete words:', error);
    throw error;
  }
}
