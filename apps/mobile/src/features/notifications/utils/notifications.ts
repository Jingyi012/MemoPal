import * as Notifications from 'expo-notifications';
import { delayToSeconds, ReviewDelay } from './scheduler';
import { getLocalizedNotificationCopy } from './localizedNotificationCopy';

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Schedule a local notification for a review reminder
export const scheduleReviewNotification = async (
  lessonId: string,
  lessonName: string,
  delay: ReviewDelay,
  reviewNumber: number,
  language?: string | null,
): Promise<string> => {
  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: delayToSeconds(delay),
  };
  const copy = getLocalizedNotificationCopy(language);

  return Notifications.scheduleNotificationAsync({
    // Using a specific identifier helps prevent duplicate notifications for the same review step
    identifier: `${lessonId}-review-${reviewNumber}`,
    content: {
      title: copy.reviewTitle,
      body: copy.reviewBody(lessonName),
      data: {
        lessonId,
        reviewNumber,
        url: `/lessons/${lessonId}/review`, // For deep linking/redirection
      },
    },
    trigger,
  });
};
// Cancel a specific notification
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all scheduled notifications (for debugging)
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
