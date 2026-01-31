/**
 * Local sync service for lesson progress and reviews
 * Syncs lesson progress and review data from API to local database
 */

import { useLessonProgressRepository } from '@/repositories/lessonProgress.repo';
import { useReviewRepository } from '@/repositories/review.repo';
import { LessonProgressService } from '../lessonProgress.service';
import { ReviewService } from '../review.service';

export class ReviewSyncService {
  /**
   * Sync lesson progress from API to local storage
   */
  static async syncLessonProgress(userId: string, lessonId: string) {
    try {
      const progress = await LessonProgressService.getProgress(lessonId);

      if (progress) {
        const repo = useLessonProgressRepository(userId);
        await repo.upsertMany([progress]);
        return progress;
      }
    } catch (error) {
      console.error('Failed to sync lesson progress:', error);
      throw error;
    }
  }

  /**
   * Sync all due reviews from API to local storage
   */
  static async syncDueReviews(userId: string) {
    try {
      const reviews = await ReviewService.getDueReviews(userId);

      if (reviews && reviews.length > 0) {
        const repo = useReviewRepository();
        await repo.upsertMany(reviews);
        return reviews;
      }
      return [];
    } catch (error) {
      console.error('Failed to sync due reviews:', error);
      throw error;
    }
  }

  /**
   * Sync review schedule for a specific lesson from API to local storage
   */
  static async syncReviewSchedule(userId: string, lessonId: string) {
    try {
      const reviews = await ReviewService.getReviewSchedule(userId, lessonId);

      if (reviews && reviews.length > 0) {
        const repo = useReviewRepository();
        await repo.upsertMany(reviews);
        return reviews;
      }
      return [];
    } catch (error) {
      console.error('Failed to sync review schedule:', error);
      throw error;
    }
  }

  /**
   * Complete a review and sync the result back to local storage
   */
  static async completeReview(
    userId: string,
    reviewScheduleId: string,
    correctCount: number,
    totalCount: number
  ) {
    try {
      const result = await ReviewService.completeReview(
        userId,
        reviewScheduleId,
        correctCount,
        totalCount
      );

      if (result.success) {
        // After completing review, sync the updated progress
        // This would be handled by the sync queue system
        return result;
      }
    } catch (error) {
      console.error('Failed to complete review:', error);
      throw error;
    }
  }
}
