import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { LessonProgress } from '@/features/palace/shared/types/lesson.types';

export const lessonProgressApi = {
  async getProgress(lessonId: string): Promise<LessonProgress> {
    const response = await api.get<GeneralResponse<LessonProgress>>(`/lessons/${lessonId}/progress`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async updateProgress(progress: LessonProgress): Promise<LessonProgress> {
    const response = await api.put<GeneralResponse<LessonProgress>>(`/lessons/${progress.lessonId}/progress`, progress);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async syncBatch(progresses: LessonProgress[]): Promise<LessonProgress[]> {
    const response = await api.post<GeneralResponse<LessonProgress[]>>('/lessons/progress/batch', { data: progresses });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
