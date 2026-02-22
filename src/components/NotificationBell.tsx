import { useUnreadNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

interface NotificationBellProps {
  unreadCount?: number;
}

export function NotificationBell() {
  const router = useRouter();
  var { data: unreadCount = 0 } = useUnreadNotifications();

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      activeOpacity={0.7}
      className="relative h-10 w-10 items-center justify-center rounded-full bg-white/20"
      accessibilityLabel="View notifications">
      <Bell size={20} color="white" />

      {unreadCount > 0 && (
        <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500">
          <Text className="text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
