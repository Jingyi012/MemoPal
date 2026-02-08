import { GeneralResponse } from '@/types/general';
import api from './api';

export interface ReviewSchedule {
  id: string;
  userId: string;
  lessonId: string;
  reviewRound: number;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export class ReviewService {
  /**
   * Get review schedule for a lesson
   */
  static async getReviewSchedule(
    userId: string,
    lessonProgressId: string
  ): Promise<ReviewSchedule[]> {
    const response = await api.get<GeneralResponse<ReviewSchedule[]>>(
      `/users/${userId}/lesson-progress/${lessonProgressId}/reviews`
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Get all due reviews for user
   */
  static async getDueReviews(userId: string): Promise<ReviewSchedule[]> {
    const response = await api.get<GeneralResponse<ReviewSchedule[]>>(
      `/users/${userId}/reviews/due`
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Complete a review
   */
  static async completeReview(
    userId: string,
    reviewScheduleId: string,
    correctCount: number,
    totalCount: number
  ): Promise<GeneralResponse<null>> {
    const response = await api.post<GeneralResponse<null>>(
      `/users/${userId}/reviews/${reviewScheduleId}/complete`,
      {
        correctCount,
        totalCount,
      }
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  }

  /**
   * Get review statistics
   */
  static async getReviewStats(userId: string): Promise<{
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
    >(`/users/${userId}/reviews/stats`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }
}
