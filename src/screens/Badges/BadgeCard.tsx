import { BADGE_RARITY_CONFIG, LOCKED_BADGE_GRADIENT } from '@/constants/badgeRarityConfig';
import { GradientColors } from '@/types/colors';
import { Badge } from '@/types/levelAndbadge';
import { iconMap } from '@/utils/IconMap';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Star } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export const BadgeCard: React.FC<{ badge: Badge }> = ({ badge }) => {
  const Icon = iconMap[badge.icon] ?? iconMap.default;
  const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity] ?? BADGE_RARITY_CONFIG.common;
  const isLocked = !badge.isEarned;
  const gradientColors = isLocked ? LOCKED_BADGE_GRADIENT : rarityConfig.gradient;

  return (
    <View className="mb-3 w-[33.33%] px-1.5">
      <View
        className="h-[168] rounded-2xl bg-white p-6"
        style={
          !isLocked && rarityConfig.glow
            ? {
                shadowColor: rarityConfig.gradient[1],
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 5,
              }
            : undefined
        }>
        <View className="relative self-center">
          <LinearGradient
            colors={gradientColors as GradientColors}
            start={[0, 0]}
            end={[1, 0]}
            style={{
              borderRadius: 10,
            }}
            className="mb-2 h-14 w-14 items-center justify-center self-center">
            <Icon size={26} color="white" />
          </LinearGradient>

          <View
            className={`absolute -right-2 -top-2 rounded-full p-1 ${isLocked ? 'bg-slate-400' : 'bg-green-400'}`}>
            {isLocked ? (
              <Lock size={12} color="white" />
            ) : (
              <Star size={12} color="white" fill="white" />
            )}
          </View>
        </View>

        <Text
          numberOfLines={1}
          className={`text-center font-medium ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
          {badge.name}
        </Text>
        <Text numberOfLines={2} className="text-center text-xs text-slate-400">
          {badge.description}
        </Text>
      </View>
    </View>
  );
};
