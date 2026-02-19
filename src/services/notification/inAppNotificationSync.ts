import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { lessonProgress, lessons, reviewSchedules } from '@/db/schema';
import { and, eq, gt, sql } from 'drizzle-orm';
import { InAppNotificationService } from '../notification.service';
import { PushNotificationService } from './pushNotificationService';

export const InAppNotificationSync = {
  /**
   * Refreshes all upcoming hardware notifications based on DB state.
   * Safe to call multiple times.
   */
  async syncAllUpcoming() {
    // 1. Fetch incomplete reviews due in the future
    const now = new Date().toISOString();

    const pendingReviews = await db
      .select({
        id: reviewSchedules.id,
        dueDate: reviewSchedules.dueDate,
        lessonName: lessons.title,
        lessonId: lessons.id,
      })
      .from(reviewSchedules)
      .innerJoin(lessonProgress, eq(reviewSchedules.lessonProgressId, lessonProgress.id))
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .where(
        and(
          eq(reviewSchedules.completed, false),
          gt(reviewSchedules.dueDate, now) // Only future ones
        )
      )
      .limit(50); // Keep under iOS limit

    // 2. Schedule them (automatically overwrites existing ones with same ID)
    for (const review of pendingReviews) {
      await PushNotificationService.scheduleReview({
        reviewId: review.id,
        lessonId: review.lessonId,
        lessonName: review.lessonName,
        dueDate: review.dueDate,
      });
    }

    console.log(`Synced ${pendingReviews.length} notifications.`);
  },

  async refreshInAppInbox() {
    const now = new Date().toISOString();

    // 1. Find reviews that are DUE NOW but don't have an inbox record yet
    // We check this by looking for 'lesson' type notifications with the same referenceId
    const dueReviews = await db
      .select()
      .from(schema.reviewSchedules)
      .innerJoin(
        schema.lessonProgress,
        eq(schema.reviewSchedules.lessonProgressId, schema.lessonProgress.id)
      )
      .innerJoin(schema.lessons, eq(schema.lessonProgress.lessonId, schema.lessons.id))
      .where(
        and(
          eq(schema.reviewSchedules.completed, false),
          sql`${schema.reviewSchedules.dueDate} <= ${now}`,
          // Logic: Only create if we haven't already created an inbox notification for this specific schedule
          sql`NOT EXISTS (
            SELECT 1 FROM ${schema.notifications} 
            WHERE ${schema.notifications.referenceId} = ${schema.reviewSchedules.id}
          )`
        )
      );

    // 2. Create the Inbox records for them
    for (const item of dueReviews) {
      await InAppNotificationService.createInAppNotification({
        type: 'lesson',
        title: 'Review Ready',
        body: `It's time to review ${item.lessons.title}`,
        referenceId: item.review_schedules.id, // Link to the specific schedule
        referenceType: 'lesson_review',
      });
    }
  },
};
