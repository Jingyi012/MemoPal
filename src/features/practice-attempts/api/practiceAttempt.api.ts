import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type {
  DueMemoryReview,
  PracticeAttempt,
  PracticeAttemptInput,
} from '@/features/practice-attempts/types/practiceAttempt.types';

export const practiceAttemptApi = {
  async createBatch(attempts: PracticeAttemptInput[]): Promise<PracticeAttempt[]> {
    const response = await api.post<GeneralResponse<PracticeAttempt[]>>(
      '/v2/practice-attempts/batch',
      { attempts }
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  async getDueReviews(): Promise<DueMemoryReview[]> {
    const response = await api.get<GeneralResponse<DueMemoryReview[]>>('/v2/reviews/due');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
