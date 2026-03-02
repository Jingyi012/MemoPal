import { AppImage } from '@/components/AppImage';
import { Colors } from '@/constants/colors';
import { User } from '@/types/users';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, User2 } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  user: User | null | undefined;
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
        <View className="flex-row items-center">
          <Text className="text-base font-semibold text-gray-900">{user?.displayName}</Text>
          {user?.isPremium ? (
            <View className="ml-2 flex-row items-center rounded-full bg-amber-100 px-2 py-0.5">
              <Crown size={12} color="#b45309" />
              <Text className="ml-1 text-[10px] font-bold uppercase text-amber-700">Premium</Text>
            </View>
          ) : null}
        </View>
        <Text className="text-sm text-gray-500">{user?.email ?? 'Guest Account'}</Text>
      </View>
    </View>
  );
};

export default ProfileCard;
