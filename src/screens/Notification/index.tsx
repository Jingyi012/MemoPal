import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import {
  Award,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronRight,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';

import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { NotificationType } from '@/enums/notificationType';
import { useNotificationMutations, useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification';

const TYPE_CONFIG = {
  [NotificationType.XP]: { icon: Zap, color: Colors.amber500, bgColor: 'bg-amber-50' },
  [NotificationType.LEVEL_UP]: {
    icon: TrendingUp,
    color: Colors.purple500,
    bgColor: 'bg-purple-50',
  },
  [NotificationType.MILESTONE]: { icon: Star, color: Colors.yellow500, bgColor: 'bg-yellow-50' },
  [NotificationType.BADGE]: { icon: Award, color: Colors.blue500, bgColor: 'bg-blue-50' },
  [NotificationType.LESSON]: { icon: BookOpen, color: Colors.green500, bgColor: 'bg-green-50' },
  [NotificationType.LESSON_REVIEW]: {
    icon: BookOpen,
    color: Colors.teal500,
    bgColor: 'bg-teal-50',
  },
  [NotificationType.SYSTEM]: { icon: Settings, color: Colors.slate500, bgColor: 'bg-slate-50' },
};

const NotificationScreen = () => {
  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotifications();
  const { markAsRead, dismiss, markAllAsRead } = useNotificationMutations();

  // Filter out dismissed notifications
  const activeNotifications = useMemo(
    () => notifications.filter((n) => !n.isDismissed),
    [notifications]
  );

  const unreadCount = useMemo(
    () => activeNotifications.filter((n) => !n.isRead).length,
    [activeNotifications]
  );

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }

    if (notification.referenceType && notification.referenceId) {
      const route = buildNavigationRoute(notification.referenceType, notification.referenceId);
      if (route) router.push(route as any);
    }
  };

  const handleDismiss = (id: string) => {
    Alert.alert('Delete Notification', 'Are you sure you want to remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dismiss.mutate(id) },
    ]);
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    markAllAsRead.mutateAsync();
  };

  const buildNavigationRoute = (
    referenceType: NotificationType | string,
    referenceId: string
  ): string | null => {
    switch (referenceType) {
      case NotificationType.LESSON:
      case NotificationType.LESSON_REVIEW:
        return `/lessons/${referenceId}`;

      case NotificationType.BADGE:
      case NotificationType.MILESTONE:
        // Both navigate to the same screen
        return `/badges`;

      case NotificationType.PALACE:
        return `/palaces/${referenceId}`;

      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const config = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.system;
    const Icon = config.icon;

    return (
      <View className="relative">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleNotificationPress(item)}
          className={`flex-row items-start border-b border-slate-100 p-4 ${
            item.isRead ? 'bg-white' : 'bg-blue-50/40'
          }`}>
          {/* Unread Indicator Dot */}
          {!item.isRead && (
            <View className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1 rounded-full bg-blue-500" />
          )}

          {/* Icon Circle */}
          <View className={`h-12 w-12 items-center justify-center rounded-full ${config.bgColor}`}>
            <Icon size={22} color={config.color} />
          </View>

          {/* Content */}
          <View className="ml-4 flex-1">
            <View className="flex-row items-center justify-between">
              <Text
                numberOfLines={1}
                className={`flex-1 pr-2 text-base ${
                  item.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-900'
                }`}>
                {item.title}
              </Text>
              <Text className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: false })}
              </Text>
            </View>

            <Text
              numberOfLines={2}
              className={`mt-1 text-sm leading-5 ${item.isRead ? 'text-slate-500' : 'text-slate-700'}`}>
              {item.body}
            </Text>

            <View className="mt-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                {item.referenceType && (
                  <View className="rounded-md bg-slate-100 px-2 py-0.5">
                    <Text className="text-[10px] font-bold uppercase text-slate-500">
                      {item.referenceType}
                    </Text>
                  </View>
                )}
              </View>

              {/* Inline Action to delete */}
              <TouchableOpacity
                onPress={() => handleDismiss(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Trash2 size={14} color={Colors.slate400} />
              </TouchableOpacity>
            </View>
          </View>

          {item.referenceType && (
            <View className="ml-2 self-center">
              <ChevronRight size={18} color={Colors.slate300} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) return <LoadingView />;

  return (
    <View className="flex-1 bg-white">
      <CommonHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up!'}
        backAction={() => router.back()}
        actions={[
          {
            icon: CheckCheck,
            onPress: handleMarkAllRead,
          },
        ]}
      />

      <FlatList
        data={activeNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="mt-32 items-center justify-center p-6">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-slate-50">
              <Bell size={40} color={Colors.slate300} />
            </View>
            <Text className="mt-4 text-xl font-bold text-slate-800">No notifications</Text>
            <Text className="mt-2 text-center text-slate-500">
              We'll notify you when something important happens.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default NotificationScreen;
