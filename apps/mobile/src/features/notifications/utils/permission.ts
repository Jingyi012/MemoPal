import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getLocalizedNotificationCopy } from './localizedNotificationCopy';

export const requestNotificationPermission = async (language?: string | null) => {
  const { status } = await Notifications.getPermissionsAsync();

  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }

  if (Platform.OS === 'android') {
    const copy = getLocalizedNotificationCopy(language);
    await Notifications.setNotificationChannelAsync('review-reminders', {
      name: copy.reviewChannelName,
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
};
