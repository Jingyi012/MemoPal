export interface ReviewStats {
  totalLessonsMastered: number;
  totalReviewsCompleted: number;
  dueTodayCount: number;
  upcomingReviewsCount: number;
}

export interface DueReviewLessonPreview {
  reviewId: string;
  lessonProgressId: string;
  lessonId: string;
  lessonTitle: string;
  dueDate: string;
  isOverdue: boolean;
}
