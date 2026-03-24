import { AppImage } from '@/components/AppImage';
import { BADGE_RARITY_CONFIG, LOCKED_BADGE_GRADIENT } from '@/constants/badgeRarityConfig';
import { GradientColors } from '@/types/colors';
import { Badge } from '@/types/levelAndbadge';
import { iconMap } from '@/utils/IconMap';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Star } from 'lucide-react-native';
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
      className="mb-3 rounded-2xl border border-slate-100 bg-white p-4"
      style={
        !isLocked && rarityConfig.glow
          ? {
              shadowColor: rarityConfig.gradient[1],
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 3,
            }
          : undefined
      }>
      <View className="flex-row items-start">
        <View className="relative">
          {badge.iconUrl ? (
            <View className="h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-white">
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
            className={`absolute -right-2 -top-2 rounded-full p-1 ${isLocked ? 'bg-slate-400' : 'bg-green-500'}`}>
            {isLocked ? (
              <Lock size={12} color="white" />
            ) : (
              <Star size={12} color="white" fill="white" />
            )}
          </View>
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-start justify-between">
            <Text
              className={`flex-1 pr-2 text-base font-semibold ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>
              {badge.name}
            </Text>
            <View className="rounded-full bg-slate-100 px-2 py-1">
              <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {rarityConfig.label}
              </Text>
            </View>
          </View>
          <Text
            className={`mt-2 text-sm leading-5 ${isLocked ? 'text-slate-500' : 'text-slate-700'}`}>
            {badge.description?.trim() ||
              'Complete the related learning challenge to unlock this badge.'}
          </Text>
        </View>
      </View>
      <Text
        className={`mt-3 text-xs font-semibold ${isLocked ? 'text-slate-500' : 'text-emerald-700'}`}>
        {isLocked ? 'Locked' : 'Earned'}
      </Text>
    </TouchableOpacity>
  );
};
