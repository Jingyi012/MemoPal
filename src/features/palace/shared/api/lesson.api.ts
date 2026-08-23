import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { Lesson } from '@/features/palace/shared/types/lesson.types';

export const lessonApi = {
  async getAll(): Promise<Lesson[]> {
    const response = await api.get<GeneralResponse<Lesson[]>>('/lessons');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getById(id: string): Promise<Lesson> {
    const response = await api.get<GeneralResponse<Lesson>>(`/lessons/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getByPalaceId(palaceId: string): Promise<Lesson[]> {
    const response = await api.get<GeneralResponse<Lesson[]>>(`/palaces/${palaceId}/lessons`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async create(lesson: Lesson): Promise<Lesson> {
    const response = await api.post<GeneralResponse<Lesson>>('/lessons', lesson);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async update(lesson: Lesson): Promise<Lesson> {
    const response = await api.put<GeneralResponse<Lesson>>(`/lessons/${lesson.id}`, lesson);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async delete(lessonId: string): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/lessons/${lessonId}`);
    if (!response.data.success) throw new Error(response.data.message);
  },
};
