import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { LessonProgress } from '@/types/lesson';

/**
 * API calls for lesson progress - organized by entity
 * Repositories never call API directly; services call API
 */
export const lessonProgressApi = {
  /**
   * Fetch lesson progress from backend
   */
  async getProgress(lessonId: string): Promise<LessonProgress> {
    const response = await api.get<GeneralResponse<LessonProgress>>(
      `/lessons/${lessonId}/progress`
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update lesson progress on backend
   */
  async updateProgress(progress: LessonProgress): Promise<LessonProgress> {
    const response = await api.put<GeneralResponse<LessonProgress>>(
      `/lessons/${progress.lessonId}/progress`,
      progress
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Sync multiple lesson progresses with backend
   * Used for batch operations
   */
  async syncBatch(progresses: LessonProgress[]): Promise<LessonProgress[]> {
    const response = await api.post<GeneralResponse<LessonProgress[]>>('/lessons/progress/batch', {
      data: progresses,
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Fetch all progress updates since last sync timestamp
   * Used for downloading backend changes
   */
  async getUpdatedSince(lastSyncedAt: string): Promise<LessonProgress[]> {
    const response = await api.get<GeneralResponse<LessonProgress[]>>('/lessons/progress/updated', {
      params: { since: lastSyncedAt },
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
