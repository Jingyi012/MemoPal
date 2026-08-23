import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { lessonProgress, lessons, reviewSchedules } from '@/db/schema';
import { NotificationType } from '@/enums/notificationType';
import { and, eq, gt, sql } from 'drizzle-orm';
import { InAppNotificationService } from './notification.service';
import { PushNotificationService } from './pushNotificationService';

export const InAppNotificationSync = {
  /**
   * Refreshes all upcoming hardware notifications based on DB state.
   * Safe to call multiple times.
   */
  async syncAllUpcoming() {
    try {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('no such table')) {
        console.warn('Notification sync skipped: local review tables are not ready yet.');
        return;
      }
      throw error;
    }
  },

  async refreshInAppInbox() {
    try {
      const now = new Date().toISOString();

      // 1. Find lessons that have an active, overdue review round
      const overdueLessons = await db
        .select({
          lessonId: schema.lessons.id,
          lessonTitle: schema.lessons.title,
        })
        .from(schema.reviewSchedules)
        .innerJoin(
          schema.lessonProgress,
          eq(schema.reviewSchedules.lessonProgressId, schema.lessonProgress.id)
        )
        .innerJoin(schema.lessons, eq(schema.lessonProgress.lessonId, schema.lessons.id))
        .where(
          and(
            eq(schema.reviewSchedules.completed, false),
            sql`${schema.reviewSchedules.dueDate} <= ${now}`
          )
        );

      if (overdueLessons.length === 0) return;

      await db.transaction(async (tx) => {
        for (const item of overdueLessons) {
          // 2. Check for an existing unread notification for this LESSON
          const existing = await tx.query.notifications.findFirst({
            where: and(
              eq(schema.notifications.referenceId, item.lessonId),
              eq(schema.notifications.type, NotificationType.LESSON_REVIEW),
              eq(schema.notifications.isRead, false),
              eq(schema.notifications.isDismissed, false)
            ),
          });

          if (existing) {
            await tx
              .update(schema.notifications)
              .set({
                createdAt: now,
                updatedAt: now,
              })
              .where(eq(schema.notifications.id, existing.id));
          } else {
            await InAppNotificationService.createInAppNotification({
              type: NotificationType.LESSON_REVIEW,
              title: 'Review Ready',
              body: `Time to review: ${item.lessonTitle}`,
              referenceId: item.lessonId, // Lesson ID is the anchor
              referenceType: NotificationType.LESSON,
            });
          }
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('no such table')) {
        console.warn('Inbox refresh skipped: local review tables are not ready yet.');
        return;
      }
      throw error;
    }
  },
};
