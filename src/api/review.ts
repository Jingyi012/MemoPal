import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { ReviewSchedule } from '@/types/lesson';

/**
 * API calls for review schedules - organized by entity
 */
export const reviewApi = {
  /**
   * Create review schedule
   */
  async create(review: ReviewSchedule): Promise<ReviewSchedule> {
    const response = await api.post<GeneralResponse<ReviewSchedule>>('/reviews', review);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Fetch all pending reviews for user
   */
  async getPendingReviews(): Promise<ReviewSchedule[]> {
    const response = await api.get<GeneralResponse<ReviewSchedule[]>>('/reviews/pending');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Fetch reviews for a specific lesson progress
   */
  async getByProgressId(progressId: string): Promise<ReviewSchedule[]> {
    const response = await api.get<GeneralResponse<ReviewSchedule[]>>(
      `/lesson-progress/${progressId}/reviews`
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get all due reviews
   */
  async getDueReviews(): Promise<ReviewSchedule[]> {
    const response = await api.get<GeneralResponse<ReviewSchedule[]>>('/reviews/due');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update review schedule
   */
  async update(review: ReviewSchedule): Promise<ReviewSchedule> {
    const response = await api.patch<GeneralResponse<ReviewSchedule>>(
      `/reviews/${review.id}`,
      review
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Mark review as completed
   */
  async complete(
    reviewId: string,
    correctCount?: number,
    totalCount?: number
  ): Promise<ReviewSchedule> {
    const response = await api.post<GeneralResponse<ReviewSchedule>>(
      `/reviews/${reviewId}/complete`,
      { correctCount, totalCount }
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Delete review schedule
   */
  async delete(reviewId: string): Promise<string> {
    const response = await api.delete<GeneralResponse<string>>(`/reviews/${reviewId}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get review statistics
   */
  async getStats(): Promise<{
    totalReviews: number;
    completedReviews: number;
    pendingReviews: number;
    dueReviews: number;
  }> {
    const response = await api.get<
      GeneralResponse<{
        totalReviews: number;
        completedReviews: number;
        pendingReviews: number;
        dueReviews: number;
      }>
    >('/reviews/stats');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

};
