import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.getPermissionsAsync();

  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('memory-palace', {
      name: 'Memory Palace Reviews',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
};
