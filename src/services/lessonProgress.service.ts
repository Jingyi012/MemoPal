import { GeneralResponse } from '@/types/general';
import { LessonProgress } from '@/types/lesson';
import api from './api';

export class LessonProgressService {
  static async getProgress(lessonId: string): Promise<LessonProgress> {
    const response = await api.get<GeneralResponse<LessonProgress>>(
      `/lessons/${lessonId}/progress`
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async updateProgress(progress: LessonProgress): Promise<LessonProgress> {
    const response = await api.put<GeneralResponse<LessonProgress>>(
      `/lessons/${progress.lessonId}/progress`,
      progress
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }
}
