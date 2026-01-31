import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

export const useNotificationObserver = () => {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') {
        // @ts-ignore
        router.push(url);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);
};
