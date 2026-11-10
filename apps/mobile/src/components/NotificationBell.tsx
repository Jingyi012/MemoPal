import { useUnreadNotifications } from '@/features/notifications/hooks/useNotifications';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { HeaderIconButton } from './ui/HeaderIconButton';
import { Bell } from '@/core/icons';

export function NotificationBell() {
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadNotifications();

  return (
    <HeaderIconButton
      icon={Bell}
      onPress={() => router.push('/notifications')}
      accessibilityLabel="View notifications">
      {unreadCount > 0 && (
        <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500">
          <Text className="text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </HeaderIconButton>
  );
}
