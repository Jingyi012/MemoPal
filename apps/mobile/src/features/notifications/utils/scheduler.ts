import * as Notifications from 'expo-notifications';

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
  reviewNumber: number
): Promise<string> => {
  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: delayToSeconds(delay),
  };

  return Notifications.scheduleNotificationAsync({
    identifier: `${lessonId}-review-${reviewNumber}`,
    content: {
      title: 'Memory Palace Review',
      body: `Time to review: ${lessonName}`,
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
