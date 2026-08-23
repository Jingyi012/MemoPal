import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { Word } from '@/features/palace/shared/types/lesson.types';

export const wordApi = {
  async getByLessonId(lessonId: string): Promise<Word[]> {
    const response = await api.get<GeneralResponse<Word[]>>('/words', { params: { lessonId } });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getById(id: string): Promise<Word> {
    const response = await api.get<GeneralResponse<Word>>(`/words/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async create(word: Word): Promise<Word> {
    const response = await api.post<GeneralResponse<Word>>('/words', word);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async createBatch(words: Partial<Word>[]): Promise<Word[]> {
    const response = await api.post<GeneralResponse<Word[]>>('/words/batch', words);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async update(word: Word): Promise<Word> {
    const response = await api.patch<GeneralResponse<Word>>(`/words/${word.id}`, word);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async updateBatch(words: Partial<Word>[]): Promise<Word[]> {
    const response = await api.patch<GeneralResponse<Word[]>>('/words/batch', words);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async delete(wordId: string): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/words/${wordId}`);
    if (!response.data.success) throw new Error(response.data.message);
  },
  async deleteBatch(wordIds: string[]): Promise<void> {
    const response = await api.post<GeneralResponse<null>>('/words/batch/delete', { ids: wordIds });
    if (!response.data.success) throw new Error(response.data.message);
  },
};
