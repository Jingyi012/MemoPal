import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type {
  DueMemoryReview,
  PracticeAttempt,
  PracticeAttemptInput,
  PracticeStats,
} from '@/features/practice-attempts/types/practiceAttempt.types';

export const practiceAttemptApi = {
  async createBatch(attempts: PracticeAttemptInput[]): Promise<PracticeAttempt[]> {
    const response = await api.post<GeneralResponse<PracticeAttempt[]>>(
      '/v1/practice-attempts/batch',
      { attempts }
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  async getStats(): Promise<PracticeStats> {
    const response = await api.get<GeneralResponse<PracticeStats>>('/v1/practice-attempts/stats');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  async getDueReviews(): Promise<DueMemoryReview[]> {
    const response = await api.get<GeneralResponse<DueMemoryReview[]>>('/v1/reviews/due');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  async getUpcomingReviews(days = 30): Promise<DueMemoryReview[]> {
    const response = await api.get<GeneralResponse<DueMemoryReview[]>>('/v1/reviews/upcoming', {
      params: { days },
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  async getHistory(memorySetId: string): Promise<PracticeAttempt[]> {
    const response = await api.get<GeneralResponse<PracticeAttempt[]>>(
      `/v1/practice-attempts/memory-set/${encodeURIComponent(memorySetId)}`
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
