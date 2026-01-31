import { useNotificationRepository } from '@/repositories/notification.repo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useNotifications = (userId: string) => {
  const notificationRepo = useNotificationRepository();

  const {
    data: notifications,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationRepo.getByUserId(userId),
    enabled: !!userId,
  });

  return {
    notifications: notifications || [],
    isLoading,
    isError,
    error,
  };
};

export const useUnreadNotifications = (userId: string) => {
  const notificationRepo = useNotificationRepository();

  const {
    data: notifications,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: () => notificationRepo.getUnreadByUserId(userId),
    enabled: !!userId,
  });

  return {
    notifications: notifications || [],
    isLoading,
    isError,
    error,
    unreadCount: notifications?.length || 0,
  };
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const notificationRepo = useNotificationRepository();

  const { mutate: markAsRead, isPending } = useMutation({
    mutationFn: (notificationId: string) => notificationRepo.markAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  return { markAsRead, isPending };
};

export const useDismissNotification = () => {
  const queryClient = useQueryClient();
  const notificationRepo = useNotificationRepository();

  const { mutate: dismiss, isPending } = useMutation({
    mutationFn: (notificationId: string) => notificationRepo.dismiss(notificationId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  return { dismiss, isPending };
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  const notificationRepo = useNotificationRepository();

  const { mutateAsync: createNotification, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof notificationRepo.create>[0]) =>
      notificationRepo.create(data),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  return { createNotification, isPending };
};
