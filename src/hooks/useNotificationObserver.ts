import { InAppNotificationSync } from '@/services/notification/inAppNotificationSync';
import { PushNotificationService } from '@/services/notification/pushNotificationService';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

export const useNotificationObserver = (enabled: boolean = true) => {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const initializeNotifications = async () => {
      try {
        // 1. Ensure permissions
        const granted = await PushNotificationService.requestPermissions();

        if (granted) {
          // 2. Sync hardware (Ensures future Push Notifications are set in the OS)
          await InAppNotificationSync.syncAllUpcoming();

          // 3. Refresh In-App Inbox (Converts reviews that became due while
          // the app was closed into visible rows in your Notifications table)
          await InAppNotificationSync.refreshInAppInbox();
        }
      } catch (error) {
        console.warn('Notification observer initialization skipped:', error);
      }
    };

    void initializeNotifications();

    // Foreground listener: Fires when a notification arrives while app is OPEN
    notificationListener.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        console.log('Notification received in foreground');

        // Since a notification just arrived, a review is now due.
        // We refresh the inbox immediately so the "Bell Icon" updates in real-time.
        await InAppNotificationSync.refreshInAppInbox();
      }
    );

    // Response listener: Fires when user TAPS a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      if (data && typeof data.url === 'string') {
        const targetPath = data.url;

        // Navigate to the review screen
        setTimeout(() => {
          router.push(targetPath as any);
        }, 100);
      }
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [enabled]);
};
