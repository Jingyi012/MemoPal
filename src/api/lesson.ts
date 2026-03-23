import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { Lesson } from '@/types/lesson';

/**
 * API calls for lessons - organized by entity
 */
export const lessonApi = {
  /**
   * Fetch all lessons
   */
  async getAll(): Promise<Lesson[]> {
    const response = await api.get<GeneralResponse<Lesson[]>>('/lessons');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Fetch lesson by ID
   */
  async getById(id: string): Promise<Lesson> {
    const response = await api.get<GeneralResponse<Lesson>>(`/lessons/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Fetch lessons by palace ID
   */
  async getByPalaceId(palaceId: string): Promise<Lesson[]> {
    const response = await api.get<GeneralResponse<Lesson[]>>(`/palaces/${palaceId}/lessons`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Create a new lesson
   */
  async create(lesson: Lesson): Promise<Lesson> {
    const response = await api.post<GeneralResponse<Lesson>>('/lessons', lesson);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update lesson
   */
  async update(lesson: Lesson): Promise<Lesson> {
    const response = await api.put<GeneralResponse<Lesson>>(`/lessons/${lesson.id}`, lesson);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Delete lesson
   */
  async delete(lessonId: string): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/lessons/${lessonId}`);
    if (!response.data.success) throw new Error(response.data.message);
  },

};
