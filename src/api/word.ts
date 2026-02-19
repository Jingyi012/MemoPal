import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { Word } from '@/types/lesson';

/**
 * API calls for words - organized by entity
 */
export const wordApi = {
  /**
   * Fetch all words for a lesson
   */
  async getByLessonId(lessonId: string): Promise<Word[]> {
    const response = await api.get<GeneralResponse<Word[]>>('/words', {
      params: { lessonId },
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get word by ID
   */
  async getById(id: string): Promise<Word> {
    const response = await api.get<GeneralResponse<Word>>(`/words/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Create a new word
   */
  async create(word: Word): Promise<Word> {
    const response = await api.post<GeneralResponse<Word>>('/words', word);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Batch create words
   */
  async createBatch(words: Partial<Word>[]): Promise<Word[]> {
    const response = await api.post<GeneralResponse<Word[]>>('/words/batch', words);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update word
   */
  async update(word: Word): Promise<Word> {
    const response = await api.patch<GeneralResponse<Word>>(`/words/${word.id}`, word);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Batch update words
   */
  async updateBatch(words: Partial<Word>[]): Promise<Word[]> {
    const response = await api.patch<GeneralResponse<Word[]>>('/words/batch', words);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Delete word
   */
  async delete(wordId: string): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/words/${wordId}`);
    if (!response.data.success) throw new Error(response.data.message);
  },

  /**
   * Batch delete words
   */
  async deleteBatch(wordIds: string[]): Promise<void> {
    const response = await api.post<GeneralResponse<null>>('/words/batch/delete', {
      ids: wordIds,
    });
    if (!response.data.success) throw new Error(response.data.message);
  },

  /**
   * Fetch words updated since last sync
   */
  async getUpdatedSince(lastSyncedAt: string): Promise<Word[]> {
    const response = await api.get<GeneralResponse<Word[]>>('/words/updated', {
      params: { since: lastSyncedAt },
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
