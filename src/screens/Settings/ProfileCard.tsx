import { AppImage } from '@/components/AppImage';
import { Colors } from '@/constants/colors';
import { User } from '@/types/users';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Pencil, User2 } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';

interface Props {
  user: User | null | undefined;
  onEdit?: () => void;
}

const ProfileCard: React.FC<Props> = ({ user, onEdit }) => {
  return (
    <View className="flex-row items-center gap-4 p-2">
      <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-gray-200 bg-slate-100">
        {user?.avatarUrl ? (
          <AppImage
            source={{ uri: user.avatarUrl }}
            style={{ width: '100%', height: '100%', borderRadius: 999 }}
          />
        ) : (
          <LinearGradient
            colors={[Colors.teal500, Colors.indigo600]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <User2 size={25} color="white" />
          </LinearGradient>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-gray-900">{user?.displayName}</Text>
            {user?.isPremium ? (
              <View className="ml-2 flex-row items-center rounded-full bg-amber-100 px-2 py-0.5">
                <Crown size={12} color="#b45309" />
                <Text className="ml-1 text-[10px] font-bold uppercase text-amber-700">Premium</Text>
              </View>
            ) : null}
          </View>

          {onEdit ? (
            <AnimatedPressable onPress={onEdit} className="rounded-full bg-slate-100 p-2">
              <Pencil size={14} color="#334155" />
            </AnimatedPressable>
          ) : null}
        </View>
        <Text className="text-sm text-gray-500">{user?.email ?? 'Guest Account'}</Text>
      </View>
    </View>
  );
};

export default ProfileCard;
