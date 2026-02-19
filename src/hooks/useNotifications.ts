import * as notificationService from '@/services/notification.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_KEYS.all, 'list'] as const,
  unread: () => [...NOTIFICATION_KEYS.all, 'unread'] as const,
};

export const useNotifications = () => {
  const query = useQuery({
    queryKey: NOTIFICATION_KEYS.lists(),
    queryFn: () => notificationService.getNotifications(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useUnreadNotifications = (userId: string) => {
  const query = useQuery({
    queryKey: NOTIFICATION_KEYS.unread(),
    queryFn: () => notificationService.getUnreadNotifications(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });

  return {
    notifications: query.data ?? [],
    unreadCount: query.data?.length ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const dismiss = useMutation({
    mutationFn: (notificationId: string) => notificationService.dismissNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const createNotification = useMutation({
    mutationFn: (notification: any) => notificationService.createNotification(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  return { markAsRead, dismiss, createNotification };
};
