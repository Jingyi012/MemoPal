import { GeneralResponse } from '@/types/general';
import { Word } from '@/types/lesson';
import api from './api';

export class WordService {
  static async getWordsByLesson(params: { lessonId: string }): Promise<GeneralResponse<Word[]>> {
    const response = await api.get<GeneralResponse<Word[]>>('/words', { params });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  }

  static async getWordById(id: string): Promise<Word> {
    const response = await api.get<GeneralResponse<Word>>(`/words/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async createWord(payload: Partial<Word>): Promise<Word> {
    const response = await api.post<GeneralResponse<Word>>('/words', payload);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async createWordsBatch(payload: Partial<Word>[]): Promise<Word[]> {
    const response = await api.post<GeneralResponse<Word[]>>('/words/batch', payload);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async updateWord(id: string, payload: Partial<Word>): Promise<Word> {
    const response = await api.patch<GeneralResponse<Word>>(`/words/${id}`, payload);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async updateWordsBatch(payload: Partial<Word>[]): Promise<Word[]> {
    const response = await api.patch<GeneralResponse<Word[]>>(`/words/batch`, payload);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async deleteWord(id: string): Promise<boolean> {
    const response = await api.delete<GeneralResponse<null>>(`/words/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  }

  static async deleteWordsBatch(ids: string[]): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(`/words/batch/delete`, { ids });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  }
}
