import * as Notifications from 'expo-notifications';
import { DateTriggerInput, SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

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

export const PushNotificationService = {
  // Request permissions
  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('review-reminders', {
        name: 'Review Reminders',
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
    lessonId: string; // From lessons.id
    lessonName: string;
    dueDate: string;
  }) {
    const date = new Date(params.dueDate);
    if (date.getTime() <= Date.now()) return;

    const trigger: DateTriggerInput = {
      type: SchedulableTriggerInputTypes.DATE,
      date: date,
      channelId: 'review-reminders',
    };

    return await Notifications.scheduleNotificationAsync({
      identifier: params.reviewId,
      content: {
        title: 'Memory Palace: Time to Review! 🧠',
        body: `Your lesson "${params.lessonName}" is ready for review.`,
        data: {
          lessonId: params.lessonId,
          url: `/lessons/${params.lessonId}`,
        },
        badge: 1,
      },
      trigger,
    });
  },

  async cancelReview(reviewId: string) {
    await Notifications.cancelScheduledNotificationAsync(reviewId);
  },

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
