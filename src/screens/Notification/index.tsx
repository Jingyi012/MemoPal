import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import {
  Award,
  Bell,
  BookOpen,
  ChevronRight,
  Settings,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthProvider';
import { useNotificationMutations, useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification';

// Map icons and colors to notification types
const TYPE_CONFIG = {
  xp: { icon: Zap, color: Colors.amber500, bgColor: 'bg-amber-50' },
  level_up: { icon: TrendingUp, color: Colors.purple500, bgColor: 'bg-purple-50' },
  milestone: { icon: Star, color: Colors.yellow500, bgColor: 'bg-yellow-50' },
  badge: { icon: Award, color: Colors.blue500, bgColor: 'bg-blue-50' },
  lesson: { icon: BookOpen, color: Colors.green500, bgColor: 'bg-green-50' },
  system: { icon: Settings, color: Colors.slate500, bgColor: 'bg-slate-50' },
};

const NotificationScreen = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const { notifications, isLoading } = useNotifications(userId);
  const { markAsRead, dismiss } = useNotificationMutations(userId);

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read when tapped
    if (!notification.isRead) {
      markAsRead.mutateAsync(notification.id);
    }

    if (notification.referenceType && notification.referenceId) {
      const route = buildNavigationRoute(notification.referenceType, notification.referenceId);
      if (route) {
        router.push(route as any);
      }
    }
  };

  const buildNavigationRoute = (referenceType: string, referenceId: string): string | null => {
    switch (referenceType) {
      case 'lesson':
        return `/lessons/${referenceId}`;
      case 'badge':
        return `/badges`;
      case 'milestone':
        return `/badges`;
      case 'palace':
        return `/palaces/${referenceId}`;
      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
    const Icon = config.icon;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
        disabled={item.isDismissed}
        className={`flex-row items-start border-b border-slate-100 p-4 ${
          item.isRead ? 'bg-white opacity-60' : 'bg-blue-50/30'
        }`}>
        {/* Icon Circle */}
        <View className={`h-12 w-12 items-center justify-center rounded-full ${config.bgColor}`}>
          <Icon size={24} color={config.color} />
        </View>

        {/* Content */}
        <View className="ml-4 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-base ${item.isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
              {item.title}
            </Text>
          </View>

          <Text className="mt-1 text-sm leading-5 text-slate-600">{item.body}</Text>

          <Text className="mt-2 text-xs text-slate-400">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>

        {item.referenceType && item.referenceId && !item.isDismissed && (
          <View className="ml-2 self-center">
            <ChevronRight size={18} color={Colors.slate400} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <View className="flex-1 bg-white">
      <CommonHeader
        title="Notifications"
        description={`${notifications.filter((n) => !n.isRead).length} unread messages`}
        backAction={() => router.back()}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="mt-20 items-center justify-center p-6">
            <Bell size={48} color={Colors.slate500} />
            <Text className="mt-4 text-lg font-medium text-slate-500">No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
};

export default NotificationScreen;
