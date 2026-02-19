import { AppImage } from '@/components/AppImage';
import { Colors } from '@/constants/colors';
import { User } from '@/types/users';
import { LinearGradient } from 'expo-linear-gradient';
import { User2 } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  user: User | null;
}

const ProfileCard: React.FC<Props> = ({ user }) => {
  return (
    <View className="flex-row items-center gap-4 p-2">
      {user?.avatarUrl ? (
        <AppImage
          source={{ uri: user.avatarUrl }}
          className="h-16 w-16 rounded-full border-2 border-gray-200"
        />
      ) : (
        <LinearGradient
          colors={[Colors.teal500, Colors.indigo600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 30 }}
          className="h-12 w-12 items-center justify-center rounded-full">
          <User2 size={25} color="white" />
        </LinearGradient>
      )}

      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{user?.displayName}</Text>
        <Text className="text-sm text-gray-500">{user?.email ?? 'Guest Account'}</Text>
      </View>
    </View>
  );
};

export default ProfileCard;
