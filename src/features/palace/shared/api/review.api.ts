import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { ReviewSchedule } from '@/features/palace/shared/types/lesson.types';

export const reviewApi = {
  async create(review: ReviewSchedule): Promise<ReviewSchedule> {
    const response = await api.post<GeneralResponse<ReviewSchedule>>('/reviews', review);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getPendingReviews(): Promise<ReviewSchedule[]> {
    const response = await api.get<GeneralResponse<ReviewSchedule[]>>('/reviews/pending');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getByProgressId(progressId: string): Promise<ReviewSchedule[]> {
    const response = await api.get<GeneralResponse<ReviewSchedule[]>>(`/lesson-progress/${progressId}/reviews`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getDueReviews(): Promise<ReviewSchedule[]> {
    const response = await api.get<GeneralResponse<ReviewSchedule[]>>('/reviews/due');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async update(review: ReviewSchedule): Promise<ReviewSchedule> {
    const response = await api.patch<GeneralResponse<ReviewSchedule>>(`/reviews/${review.id}`, review);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async complete(reviewId: string, correctCount?: number, totalCount?: number): Promise<ReviewSchedule> {
    const response = await api.post<GeneralResponse<ReviewSchedule>>(`/reviews/${reviewId}/complete`, { correctCount, totalCount });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async delete(reviewId: string): Promise<string> {
    const response = await api.delete<GeneralResponse<string>>(`/reviews/${reviewId}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getStats(): Promise<{ totalReviews: number; completedReviews: number; pendingReviews: number; dueReviews: number }> {
    const response = await api.get<GeneralResponse<{ totalReviews: number; completedReviews: number; pendingReviews: number; dueReviews: number }>>('/reviews/stats');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
