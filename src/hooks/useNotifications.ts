import { InAppNotificationService } from '@/services/notification.service';
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

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) => InAppNotificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => InAppNotificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const dismiss = useMutation({
    mutationFn: (notificationId: string) => InAppNotificationService.dismiss(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const createNotification = useMutation({
    mutationFn: (notification: any) =>
      InAppNotificationService.createInAppNotification(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  return { markAsRead, markAllAsRead, dismiss, createNotification };
};
