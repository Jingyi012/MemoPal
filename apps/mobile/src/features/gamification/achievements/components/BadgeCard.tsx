import { getBaseCardClassName } from '@/components/BaseCard';
import { AppImage } from '@/components/AppImage';
import { BADGE_RARITY_CONFIG, LOCKED_BADGE_GRADIENT } from '@/features/gamification/shared/constants/badgeRarityConfig';
import { GradientColors } from '@/core/types/colors';
import { Badge } from '@/features/gamification/shared/types/levelAndbadge';
import { iconMap } from '@/utils/IconMap';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface BadgeCardProps {
  badge: Badge & { isEarned: boolean };
  onPress?: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, onPress }) => {
  const Icon = iconMap[badge.icon ?? 'brain'] ?? iconMap['brain'];
  const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity ?? 'common'] ?? BADGE_RARITY_CONFIG.common;
  const isLocked = !badge.isEarned;
  const gradientColors = isLocked ? LOCKED_BADGE_GRADIENT : rarityConfig.gradient;

  if (!Icon) {
    console.warn(`Icon not found for badge: ${badge.icon}, using default`);
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={getBaseCardClassName({
        className: 'mb-3 border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4',
        padding: 'none',
      })}
      style={
        !isLocked && rarityConfig.glow
          ? {
              boxShadow: `0px 3px 10px ${rarityConfig.gradient[1]}4D`,
            }
          : undefined
      }>
      <View className="flex-row items-start">
        <View className="relative">
          {badge.iconUrl ? (
            <View className="h-14 w-14 overflow-hidden rounded-xl border border-[#EEE9DC] bg-white">
              <AppImage
                source={{ uri: badge.iconUrl }}
                className="h-full w-full"
                contentFit="cover"
              />
            </View>
          ) : (
            <LinearGradient
              colors={gradientColors as GradientColors}
              start={[0, 0]}
              end={[1, 0]}
              style={{
                borderRadius: 10,
              }}
              className="h-14 w-14 items-center justify-center">
              <Icon size={26} color="white" />
            </LinearGradient>
          )}

          <View
            className={`absolute -right-2 -top-2 rounded-full p-1 ${isLocked ? 'bg-[#D8D4C9]' : 'bg-[#3FB87F]'}`}>
            <Text className="text-xs">{isLocked ? '🔒' : '⭐'}</Text>
          </View>
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-start justify-between">
            <Text
              className={`flex-1 pr-2 text-base font-semibold ${isLocked ? 'text-[#9A97A7]' : 'text-[#2B2A3D]'}`}>
              {badge.name}
            </Text>
            <View className="rounded-full bg-[#F6F3EA] px-2 py-1">
              <Text className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A80]">
                {rarityConfig.label}
              </Text>
            </View>
          </View>
          <Text
            className={`mt-2 text-sm leading-5 ${isLocked ? 'text-[#9A97A7]' : 'text-[#6B6A80]'}`}>
            {badge.description?.trim() ||
              'Complete the related learning challenge to unlock this badge.'}
          </Text>
        </View>
      </View>
      <Text
        className={`mt-3 text-xs font-semibold ${isLocked ? 'text-[#9A97A7]' : 'text-[#3FB87F]'}`}>
        {isLocked ? 'Locked' : 'Earned'}
      </Text>
    </TouchableOpacity>
  );
};
