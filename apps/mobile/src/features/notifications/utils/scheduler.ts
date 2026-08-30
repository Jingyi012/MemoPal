import * as Notifications from 'expo-notifications';
import { getLocalizedNotificationCopy } from './localizedNotificationCopy';

export type ReviewDelay = { unit: 'hours'; value: number } | { unit: 'days'; value: number };

export const HOUR_IN_SECONDS = 60 * 60;
export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;

export function delayToSeconds(delay: ReviewDelay): number {
  switch (delay.unit) {
    case 'hours':
      return delay.value * HOUR_IN_SECONDS;
    case 'days':
      return delay.value * DAY_IN_SECONDS;
    default:
      return 0;
  }
}

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
    identifier: `${lessonId}-review-${reviewNumber}`,
    content: {
      title: copy.reviewTitle,
      body: copy.reviewBody(lessonName),
      data: {
        lessonId,
        reviewNumber,
      },
    },
    trigger,
  });
};

export const scheduleDailyNotification = async (
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number = 0
): Promise<string> => {
  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };

  return Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
    },
    trigger,
  });
};
