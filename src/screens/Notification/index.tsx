import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import {
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  TrendingUp,
  Trophy,
} from 'lucide-react-native';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { CommonHeader } from '@/components/CommonHeader';
import { Colors } from '@/constants/colors';
import { Notification } from '@/types/notification';
import notificationData from '@/utils/mock/notifications.json';

// Map icons and colors to notification types
const TYPE_CONFIG = {
  review: { icon: Clock, color: Colors.gray300, bgColor: 'bg-blue-50' },
  achievement: { icon: Trophy, color: Colors.yellow500, bgColor: 'bg-yellow-50' },
  streak: { icon: Flame, color: Colors.orange500, bgColor: 'bg-orange-50' },
  level: { icon: TrendingUp, color: Colors.purple500, bgColor: 'bg-purple-50' },
  complete: { icon: CheckCircle, color: Colors.gray500, bgColor: 'bg-green-50' },
  premium: { icon: Crown, color: Colors.amber500, bgColor: 'bg-amber-50' },
};

const NotificationScreen = () => {
  const notifications = notificationData.notifications as Notification[];

  const renderItem = ({ item }: { item: Notification }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.review;
    const Icon = config.icon;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => item.actionUrl && router.push(item.actionUrl as any)}
        className={`flex-row items-start border-b border-slate-100 p-4 ${
          item.read ? 'bg-white' : 'bg-blue-50/30'
        }`}>
        {/* Icon Circle */}
        <View className={`h-12 w-12 items-center justify-center rounded-full ${config.bgColor}`}>
          <Icon size={24} color={config.color} />
        </View>

        {/* Content */}
        <View className="ml-4 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-base ${item.read ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
              {item.title}
            </Text>
          </View>

          <Text className="mt-1 text-sm leading-5 text-slate-600">{item.message}</Text>

          <Text className="mt-2 text-xs text-slate-400">
            {/* If not using date-fns, you can just use item.createdAt */}
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>

        {item.actionUrl && (
          <View className="ml-2 self-center">
            <ChevronRight size={18} color={Colors.slate400} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <CommonHeader
        title="Notifications"
        description={`${notifications.filter((n) => !n.read).length} unread messages`}
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
