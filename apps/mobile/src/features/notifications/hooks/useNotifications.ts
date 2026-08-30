import { InAppNotificationService } from '@/features/notifications/services/notification.service';
import { Notification } from '@/features/notifications/types/notification';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_KEYS.all, 'list'] as const,
  unread: () => [...NOTIFICATION_KEYS.all, 'unread'] as const,
};

export const useNotifications = () => {
  const query = useQuery({
    queryKey: NOTIFICATION_KEYS.lists(),
    queryFn: () => InAppNotificationService.getNotifications(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return query;
};

export const useUnreadNotifications = () => {
  const query = useQuery({
    queryKey: NOTIFICATION_KEYS.unread(),
    queryFn: () => InAppNotificationService.getUnreadCount(),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });

  return query;
};

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const setUnreadCount = (updater: (count: number) => number) => {
    queryClient.setQueryData<number>(NOTIFICATION_KEYS.unread(), (previous = 0) =>
      Math.max(0, updater(previous))
    );
  };

  const setNotificationList = (updater: (list: Notification[]) => Notification[]) => {
    queryClient.setQueryData<Notification[]>(NOTIFICATION_KEYS.lists(), (previous = []) =>
      updater(previous)
    );
  };

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) => InAppNotificationService.markAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      let didTransitionFromUnread = false;
      setNotificationList((list) =>
        list.map((item) => {
          if (item.id !== notificationId) return item;
          didTransitionFromUnread = !item.isRead;
          return item.isRead
            ? item
            : { ...item, isRead: true, readAt: new Date().toISOString() };
        })
      );

      if (didTransitionFromUnread) {
        setUnreadCount((count) => count - 1);
      }

      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => InAppNotificationService.markAllAsRead(),
    onSuccess: () => {
      setNotificationList((list) => {
        const now = new Date().toISOString();
        return list.map((item) =>
          item.isRead ? item : { ...item, isRead: true, readAt: now }
        );
      });
      queryClient.setQueryData<number>(NOTIFICATION_KEYS.unread(), 0);

      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const dismiss = useMutation({
    mutationFn: (notificationId: string) => InAppNotificationService.dismiss(notificationId),
    onSuccess: (_, notificationId) => {
      let removedUnread = false;
      setNotificationList((list) =>
        list.map((item) => {
          if (item.id !== notificationId) return item;
          removedUnread = !item.isRead && !item.isDismissed;
          return item.isDismissed ? item : { ...item, isDismissed: true };
        })
      );

      if (removedUnread) {
        setUnreadCount((count) => count - 1);
      }

      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const restore = useMutation({
    mutationFn: (notificationId: string) => InAppNotificationService.restore(notificationId),
    onSuccess: (_, notificationId) => {
      let restoredUnread = false;
      setNotificationList((list) =>
        list.map((item) => {
          if (item.id !== notificationId) return item;
          restoredUnread = item.isDismissed && !item.isRead;
          return item.isDismissed ? { ...item, isDismissed: false } : item;
        })
      );

      if (restoredUnread) {
        setUnreadCount((count) => count + 1);
      }

      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const createNotification = useMutation({
    mutationFn: (notification: any) =>
      InAppNotificationService.createInAppNotification(notification),
    onSuccess: (created) => {
      setNotificationList((list) => [created, ...list]);
      if (!created.isRead && !created.isDismissed) {
        setUnreadCount((count) => count + 1);
      }
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
    },
  });

  return { markAsRead, markAllAsRead, dismiss, restore, createNotification };
};
