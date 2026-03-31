import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { NotificationType } from '@/enums/notificationType';
import { useNotificationMutations, useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import {
  Award,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Settings,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

const TYPE_CONFIG = {
  [NotificationType.XP]: { icon: Zap, color: Colors.amber500, bgColor: 'bg-amber-50' },
  [NotificationType.LEVEL_UP]: {
    icon: TrendingUp,
    color: Colors.purple500,
    bgColor: 'bg-purple-50',
  },
  [NotificationType.MILESTONE]: { icon: Star, color: Colors.yellow500, bgColor: 'bg-yellow-50' },
  [NotificationType.BADGE]: { icon: Award, color: Colors.blue500, bgColor: 'bg-blue-50' },
  [NotificationType.REFERRAL]: { icon: Users, color: Colors.indigo500, bgColor: 'bg-indigo-50' },
  [NotificationType.LESSON]: { icon: BookOpen, color: Colors.green500, bgColor: 'bg-green-50' },
  [NotificationType.LESSON_REVIEW]: {
    icon: BookOpen,
    color: Colors.teal500,
    bgColor: 'bg-teal-50',
  },
  [NotificationType.SYSTEM]: { icon: Settings, color: Colors.slate500, bgColor: 'bg-slate-50' },
};

type NotificationListRow =
  | {
      type: 'header';
      id: string;
      title: string;
      count: number;
    }
  | {
      type: 'item';
      id: string;
      notification: Notification;
    };

const NotificationScreen = () => {
  const router = useRouter();
  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotifications();
  const { markAsRead, dismiss, restore, markAllAsRead } = useNotificationMutations();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoPayload, setUndoPayload] = useState<{ ids: string[]; count: number } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isDismissed),
    [notifications]
  );

  const unreadCount = useMemo(
    () => activeNotifications.filter((notification) => !notification.isRead).length,
    [activeNotifications]
  );

  const unreadNotifications = useMemo(
    () => activeNotifications.filter((notification) => !notification.isRead),
    [activeNotifications]
  );

  const readNotifications = useMemo(
    () => activeNotifications.filter((notification) => notification.isRead),
    [activeNotifications]
  );

  const allSelectableIds = useMemo(
    () => activeNotifications.map((notification) => notification.id),
    [activeNotifications]
  );

  const listRows = useMemo<NotificationListRow[]>(() => {
    if (isSelectionMode) {
      return activeNotifications.map((notification) => ({
        type: 'item',
        id: notification.id,
        notification,
      }));
    }

    const rows: NotificationListRow[] = [];

    if (unreadNotifications.length > 0) {
      rows.push({
        type: 'header',
        id: 'header-unread',
        title: 'Unread',
        count: unreadNotifications.length,
      });
      rows.push(
        ...unreadNotifications.map((notification) => ({
          type: 'item' as const,
          id: notification.id,
          notification,
        }))
      );
    }

    if (readNotifications.length > 0) {
      rows.push({
        type: 'header',
        id: 'header-earlier',
        title: unreadNotifications.length > 0 ? 'Earlier' : 'Recent',
        count: readNotifications.length,
      });
      rows.push(
        ...readNotifications.map((notification) => ({
          type: 'item' as const,
          id: notification.id,
          notification,
        }))
      );
    }

    return rows;
  }, [activeNotifications, isSelectionMode, readNotifications, unreadNotifications]);

  const selectedCount = selectedNotificationIds.length;
  const isAllSelected = allSelectableIds.length > 0 && selectedCount === allSelectableIds.length;

  useEffect(() => {
    setSelectedNotificationIds((previous) =>
      previous.filter((id) => allSelectableIds.includes(id))
    );
  }, [allSelectableIds]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const clearSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedNotificationIds([]);
  };

  const toggleSelection = (notificationId: string) => {
    setSelectedNotificationIds((previous) =>
      previous.includes(notificationId)
        ? previous.filter((id) => id !== notificationId)
        : [...previous, notificationId]
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNotificationIds([]);
      return;
    }
    setSelectedNotificationIds(allSelectableIds);
  };

  const handleNotificationLongPress = (notification: Notification) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedNotificationIds([notification.id]);
      return;
    }
    toggleSelection(notification.id);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (isSelectionMode) {
      toggleSelection(notification.id);
      return;
    }

    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }

    if (notification.referenceType && notification.referenceId) {
      const route = buildNavigationRoute(notification.referenceType, notification.referenceId);
      if (route) router.push(route as any);
    }
  };

  const beginUndoWindow = (ids: string[]) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    if (ids.length === 0) {
      setUndoPayload(null);
      return;
    }

    setUndoPayload({ ids, count: ids.length });
    undoTimerRef.current = setTimeout(() => {
      setUndoPayload(null);
      undoTimerRef.current = null;
    }, 5000);
  };

  const handleRemoveSelected = async () => {
    if (selectedCount === 0 || isRemoving) return;

    const targetIds = [...selectedNotificationIds];
    setIsRemoving(true);
    try {
      const results = await Promise.allSettled(
        targetIds.map((notificationId) => dismiss.mutateAsync(notificationId))
      );

      const successIds = results
        .map((result, index) => ({ result, id: targetIds[index] }))
        .filter((entry) => entry.result.status === 'fulfilled')
        .map((entry) => entry.id);

      const failedIds = results
        .map((result, index) => ({ result, id: targetIds[index] }))
        .filter((entry) => entry.result.status === 'rejected')
        .map((entry) => entry.id);

      beginUndoWindow(successIds);

      if (failedIds.length > 0) {
        setIsSelectionMode(true);
        setSelectedNotificationIds(failedIds);
        Toast.show({
          type: 'error',
          text1: 'Some removes failed',
          text2: `${failedIds.length} notification${failedIds.length > 1 ? 's' : ''} could not be removed.`,
        });
      } else {
        clearSelectionMode();
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Remove failed',
        text2: 'Unable to remove selected notifications.',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleUndoRemove = async () => {
    if (!undoPayload || isUndoing) return;

    const targetIds = [...undoPayload.ids];
    setIsUndoing(true);
    try {
      const results = await Promise.allSettled(
        targetIds.map((notificationId) => restore.mutateAsync(notificationId))
      );
      const failedCount = results.filter((result) => result.status === 'rejected').length;

      if (failedCount > 0) {
        Toast.show({
          type: 'error',
          text1: 'Undo incomplete',
          text2: `${failedCount} notification${failedCount > 1 ? 's' : ''} could not be restored.`,
        });
      }
    } finally {
      setUndoPayload(null);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      setIsUndoing(false);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || isSelectionMode) return;
    markAllAsRead.mutateAsync();
  };

  const handleBackAction = () => {
    if (isSelectionMode) {
      clearSelectionMode();
      return;
    }
    router.back();
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
        return `/badges`;

      case NotificationType.PALACE:
        return `/palaces/${referenceId}`;

      case NotificationType.REFERRAL:
        return '/referral';

      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: NotificationListRow }) => {
    if (item.type === 'header') {
      return (
        <View className="px-4 pb-2 pt-3">
          <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {item.title} ({item.count})
          </Text>
        </View>
      );
    }

    const notification = item.notification;
    const config =
      TYPE_CONFIG[notification.type as keyof typeof TYPE_CONFIG] ||
      TYPE_CONFIG[NotificationType.SYSTEM];
    const Icon = config.icon;
    const isSelected = selectedNotificationIds.includes(notification.id);

    return (
      <View className="relative">
        <TouchableOpacity
          activeOpacity={0.7}
          onLongPress={() => handleNotificationLongPress(notification)}
          delayLongPress={220}
          onPress={() => void handleNotificationPress(notification)}
          className={`mx-4 mb-2 flex-row items-start rounded-2xl border px-4 py-3 ${
            isSelectionMode && isSelected
              ? 'border-red-200 bg-red-50'
              : notification.isRead
                ? 'border-slate-200 bg-white'
                : 'border-blue-100 bg-blue-50/60'
          }`}>
          {isSelectionMode && (
            <View className="mr-3 mt-2">
              <View
                className={`h-5 w-5 items-center justify-center rounded-md border ${
                  isSelected ? 'border-red-500 bg-red-500' : 'border-slate-300 bg-white'
                }`}>
                {isSelected && <Check size={12} color="white" />}
              </View>
            </View>
          )}

          <View className={`h-12 w-12 items-center justify-center rounded-full ${config.bgColor}`}>
            <Icon size={22} color={config.color} />
          </View>

          <View className="ml-4 flex-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center pr-2">
                <Text
                  numberOfLines={1}
                  className={`flex-1 text-base ${
                    notification.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-900'
                  }`}>
                  {notification.title}
                </Text>
                {!isSelectionMode && !notification.isRead && (
                  <View className="ml-2 rounded-full bg-blue-100 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-blue-700">NEW</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </Text>
            </View>

            <Text
              numberOfLines={2}
              className={`mt-1 text-sm leading-5 ${
                notification.isRead ? 'text-slate-500' : 'text-slate-700'
              }`}>
              {notification.body}
            </Text>

            <View className="mt-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                {notification.referenceType && (
                  <View className="rounded-md bg-slate-100 px-2 py-0.5">
                    <Text className="text-[10px] font-bold uppercase text-slate-500">
                      {notification.referenceType}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {!isSelectionMode && notification.referenceType && (
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
        description={
          isSelectionMode
            ? selectedCount > 0
              ? `${selectedCount} selected`
              : 'Tap notifications to select'
            : unreadCount > 0
              ? `${unreadCount} unread messages`
              : 'All caught up!'
        }
        backAction={handleBackAction}
        actions={
          isSelectionMode
            ? []
            : [
                {
                  icon: CheckCheck,
                  onPress: handleMarkAllRead,
                },
              ]
        }
      />

      {isSelectionMode && (
        <View className="mb-2 border-b border-slate-200 bg-white px-4 py-3">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={clearSelectionMode} activeOpacity={0.7}>
              <Text className="font-semibold text-slate-700">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-sm font-medium text-slate-700">{selectedCount} selected</Text>
            <TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.7}>
              <Text className="font-semibold text-slate-700">
                {isAllSelected ? 'Unselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={listRows}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: isSelectionMode ? 132 : undoPayload ? 110 : 40 }}
        ListEmptyComponent={
          <View className="mt-32 items-center justify-center p-6">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-slate-50">
              <Bell size={40} color={Colors.slate300} />
            </View>
            <Text className="mt-4 text-xl font-bold text-slate-800">No notifications</Text>
            <Text className="mt-2 text-center text-slate-500">
              We&apos;ll notify you when something important happens.
            </Text>
          </View>
        }
      />

      {isSelectionMode && (
        <View className="border-t border-slate-200 bg-white px-4 pb-5 pt-3">
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={selectedCount === 0 || isRemoving}
            onPress={() => void handleRemoveSelected()}
            className={`flex-row items-center justify-center rounded-xl py-3 ${
              selectedCount === 0 || isRemoving ? 'bg-slate-200' : 'bg-red-600'
            }`}>
            {isRemoving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="font-semibold text-white">
                {selectedCount > 0 ? `Remove (${selectedCount})` : 'Select notifications to remove'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!isSelectionMode && undoPayload && (
        <View className="absolute bottom-5 left-4 right-4 rounded-xl bg-slate-900 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-sm font-medium text-white">
              {undoPayload.count} notification{undoPayload.count > 1 ? 's' : ''} removed
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isUndoing}
              onPress={() => void handleUndoRemove()}
              className="ml-3 rounded-lg bg-white/20 px-3 py-1">
              {isUndoing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="font-semibold text-white">Undo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default NotificationScreen;
