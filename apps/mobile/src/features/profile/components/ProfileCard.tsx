import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appTextStyles, fontFamilies } from '@/theme/designSystem';
import { AppImage } from '@/components/AppImage';
import { User } from '@/features/profile/types/users';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Pencil } from '@/core/icons';
import React from 'react';
import { View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';

interface Props {
  user: User | null | undefined;
  onEdit?: () => void;
}

const ProfileCard: React.FC<Props> = ({ user, onEdit }) => {
  return (
    <View className="flex-row items-center gap-4 p-2">
      <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-line-berry bg-tint-berry">
        {user?.avatarUrl ? (
          <AppImage
            source={{ uri: user.avatarUrl }}
            style={{ width: '100%', height: '100%', borderRadius: appRadii.pill }}
          />
        ) : (
          <LinearGradient
            colors={[theme.sun, theme.berry]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: appRadii.pill,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontSize: appArtworkSizes.medium, lineHeight: appArtworkSizes.medium + 4 }}>🙂</Text>
          </LinearGradient>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-[#2B2A3D]" style={[appTextStyles.body, { fontFamily: fontFamilies.bodySemibold }]}>{user?.displayName}</Text>
            {user?.isPremium ? (
              <View className="ml-2 flex-row items-center rounded-full bg-tint-sun px-2 py-0.5">
                <Text style={appTextStyles.caption}>👑</Text>
                <Text className="ml-1 uppercase text-[#F2A900]" style={[appTextStyles.caption, { fontFamily: fontFamilies.bodyBold }]}>Premium</Text>
              </View>
            ) : null}
          </View>

          {onEdit ? (
            <AnimatedPressable onPress={onEdit} className="rounded-full bg-tint-sky p-2">
              <Pencil size={14} color={theme.inkSoft} />
            </AnimatedPressable>
          ) : null}
        </View>
        <Text className="text-ink-soft" style={appTextStyles.label}>{user?.email ?? 'Guest Account'}</Text>
      </View>
    </View>
  );
};

export default ProfileCard;
