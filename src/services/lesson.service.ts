import { GeneralResponse, PagedResponse } from '@/types/general';
import { Lesson, LessonDetails } from '@/types/lesson';
import api from './api';

export class LessonService {
  static async getPagedLessonsByPalace(params: {
    pageNumber: number;
    pageSize: number;
    palaceId: string;
  }): Promise<PagedResponse<Lesson[]>> {
    const response = await api.get<PagedResponse<Lesson[]>>('/lessons', {
      params,
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  }

  static async getLessonById(id: string) {
    const response = await api.get<GeneralResponse<LessonDetails>>(`/lessons/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async createLesson(form: Partial<Lesson>) {
    const response = await api.post<GeneralResponse<Lesson>>('/lessons', form);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async updateLesson(id: string, form: Partial<Lesson>) {
    const response = await api.patch<GeneralResponse<Lesson>>(`/lessons/${id}`, form);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async deleteLesson(id: string) {
    const response = await api.delete<GeneralResponse<null>>(`/lessons/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  }
}
