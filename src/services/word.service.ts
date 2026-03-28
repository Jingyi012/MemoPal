import { wordApi } from '@/api/word';
import { createWordRepository } from '@/repositories/word.repo';
import { Word } from '@/types/lesson';

/**
 * Get words by lesson with two-way sync
 */
export async function getWordsByLesson(lessonId: string): Promise<Word[]> {
  const repo = createWordRepository();
  try {
    // Attempt to fetch words from backend
    const remoteWords = await wordApi.getByLessonId(lessonId);
    // Merge remote data with local (respects dirty state) and prune stale synced words.
    await repo.upsertMany(remoteWords ?? [], {
      pruneMissingSynced: true,
      lessonId,
    });
  } catch (error) {
    console.warn(`Failed to sync words for lesson ${lessonId}, using local data:`, error);
  }

  // Return local data (offline-first)
  return await repo.getAllByLesson(lessonId);
}

/**
 * Get word by ID with fallback to local
 */
export async function getWordById(id: string): Promise<Word | null> {
  const repo = createWordRepository();
  try {
    const remoteWord = await wordApi.getById(id);
    if (remoteWord) {
      // Update local copy
      await repo.upsertMany([remoteWord]);
      return remoteWord;
    }
  } catch (error) {
    console.warn('Failed to sync word, using local data:', error);
  }

  return null;
}

/**
 * Sync lesson words (offline-first)
 * Compares incoming words with local DB and syncs accordingly
 */
export async function syncLessonWords(lessonId: string, words: Partial<Word>[]): Promise<void> {
  const repo = createWordRepository();
  try {
    // Save locally first (offline-first)
    await repo.syncLessonWords(lessonId, words);
  } catch (error) {
    console.error('Failed to sync lesson words locally:', error);
    throw error;
  }
}

/**
 * Create word (offline-first)
 * 1. Create locally and queue for sync
 * 2. Background: sync queue processor sends to backend
 */
export async function createWord(payload: Partial<Word>): Promise<string> {
  const repo = createWordRepository();
  try {
    // Create locally first (offline-first)
    return await repo.save(payload);
  } catch (error) {
    console.error('Failed to create word locally:', error);
    throw error;
  }
}

/**
 * Batch create words (offline-first)
 * 1. Create locally and queue for sync
 * 2. Background: sync queue processor sends to backend
 */
export async function createWordsBatch(payload: Partial<Word>[]): Promise<string[]> {
  const repo = createWordRepository();
  try {
    // Create locally first (offline-first)
    return await repo.batchSave(payload);
  } catch (error) {
    console.error('Failed to batch create words:', error);
    throw error;
  }
}

/**
 * Update word (offline-first)
 */
export async function updateWord(id: string, payload: Partial<Word>): Promise<void> {
  const repo = createWordRepository();
  try {
    await repo.save({ ...payload, id });
  } catch (error) {
    console.error('Failed to update word:', error);
    throw error;
  }
}

/**
 * Batch update words (offline-first)
 */
export async function updateWordsBatch(payload: Partial<Word>[]): Promise<void> {
  const repo = createWordRepository();
  try {
    await repo.batchSave(payload);
  } catch (error) {
    console.error('Failed to batch update words:', error);
    throw error;
  }
}

/**
 * Delete word (offline-first, soft delete)
 */
export async function deleteWord(id: string): Promise<void> {
  const repo = createWordRepository();
  try {
    await repo.delete(id);
  } catch (error) {
    console.error('Failed to delete word:', error);
    throw error;
  }
}

/**
 * Batch delete words (offline-first, soft delete)
 */
export async function deleteWordsBatch(ids: string[]): Promise<void> {
  const repo = createWordRepository();
  try {
    await repo.batchDelete(ids);
  } catch (error) {
    console.error('Failed to batch delete words:', error);
    throw error;
  }
}
