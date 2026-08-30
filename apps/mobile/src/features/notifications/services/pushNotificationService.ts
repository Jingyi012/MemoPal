import * as Notifications from 'expo-notifications';
import { DateTriggerInput, SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { getLocalizedNotificationCopy } from '@/features/notifications/utils/localizedNotificationCopy';

// Configure how notifications behave when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const DAILY_LEARNING_NOTIFICATION_ID = 'daily-learning-reminder';
export const REVIEW_NOTIFICATION_PREFIX = 'review-';

type ReviewNotification = {
  id: string;
  memorySetId: string;
  memorySetTitle: string;
  techniqueKey: 'palace' | 'number-peg';
  dueAt: string;
};

type PermissionOptions = {
  prompt?: boolean;
  language?: string | null;
};

export const PushNotificationService = {
  // Check permissions at startup without unexpectedly opening a system dialog.
  // Settings can call this with the default prompt behavior when the user
  // explicitly enables a reminder.
  async requestPermissions({ prompt = true, language }: PermissionOptions = {}) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (prompt && existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      const copy = getLocalizedNotificationCopy(language);
      await Notifications.setNotificationChannelAsync('review-reminders', {
        name: copy.reviewChannelName,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return finalStatus === 'granted';
  },

  // Schedule a specific review based on your Schema
  async scheduleReview(params: {
    reviewId: string; // From reviewSchedules.id
    memorySetId: string;
    memorySetTitle: string;
    techniqueKey: 'palace' | 'number-peg';
    dueDate: string;
    language?: string | null;
  }) {
    const date = new Date(params.dueDate);
    if (date.getTime() <= Date.now()) return;

    const identifier = `${REVIEW_NOTIFICATION_PREFIX}${params.reviewId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
    const copy = getLocalizedNotificationCopy(params.language);

    const trigger: DateTriggerInput = {
      type: SchedulableTriggerInputTypes.DATE,
      date: date,
      channelId: 'review-reminders',
    };

    return await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: copy.reviewTitle,
        body: copy.reviewBody(params.memorySetTitle),
        data: {
          memorySetId: params.memorySetId,
          url: params.techniqueKey === 'palace'
            ? `/palaces/memory/${params.memorySetId}?mode=recall`
            : `/number-peg/${params.memorySetId}?mode=recall`,
        },
        badge: 1,
      },
      trigger,
    });
  },

  async cancelReview(reviewId: string) {
    await Notifications.cancelScheduledNotificationAsync(`${REVIEW_NOTIFICATION_PREFIX}${reviewId}`);
  },

  async syncReviewNotifications(reviews: ReviewNotification[], language?: string | null) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((request) => request.identifier.startsWith(REVIEW_NOTIFICATION_PREFIX))
        .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined))
    );

    await Promise.all(
      reviews
        .slice(0, 50)
        .map((review) => this.scheduleReview({
          reviewId: review.id,
          memorySetId: review.memorySetId,
          memorySetTitle: review.memorySetTitle,
          techniqueKey: review.techniqueKey,
          dueDate: review.dueAt,
          language,
        }))
    );
  },

  async cancelAllReviewNotifications() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((request) => request.identifier.startsWith(REVIEW_NOTIFICATION_PREFIX))
        .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined))
    );
  },

  async scheduleDailyLearning(time: string, language?: string | null) {
    const [h, m] = time.split(':').map((x) => Number(x));
    if (Number.isNaN(h) || Number.isNaN(m)) return;

    await Notifications.cancelScheduledNotificationAsync(DAILY_LEARNING_NOTIFICATION_ID).catch(() => undefined);
    const copy = getLocalizedNotificationCopy(language);

    return Notifications.scheduleNotificationAsync({
      identifier: DAILY_LEARNING_NOTIFICATION_ID,
      content: {
        title: copy.dailyLearningTitle,
        body: copy.dailyLearningBody,
        data: { url: '/(tabs)' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: m,
        channelId: 'review-reminders',
      },
    });
  },

  async cancelDailyLearning() {
    await Notifications.cancelScheduledNotificationAsync(DAILY_LEARNING_NOTIFICATION_ID).catch(() => undefined);
  },

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
