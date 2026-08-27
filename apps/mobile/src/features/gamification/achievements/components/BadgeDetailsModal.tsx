import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { BADGE_RARITY_CONFIG, LOCKED_BADGE_GRADIENT } from '@/features/gamification/shared/constants/badgeRarityConfig';
import { GradientColors } from '@/core/types/colors';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { Badge } from '@/features/gamification/shared/types/levelAndbadge';
import { iconMap } from '@/utils/IconMap';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Brain } from 'lucide-react-native'; // Dynamic badge icons remain configurable.
import React from 'react';
import { Modal, ScrollView, Text, View, Pressable } from 'react-native';

interface BadgeDetailsModalProps {
  badge: (Badge & { isEarned: boolean }) | null;
  visible: boolean;
  onClose: () => void;
}

export const BadgeDetailsModal: React.FC<BadgeDetailsModalProps> = ({
  badge,
  visible,
  onClose,
}) => {
  if (!badge) return null;

  // 1. Fallback for Icon (Prevents crash if icon string is invalid)
  const Icon = badge.icon && iconMap[badge.icon] ? iconMap[badge.icon] : Brain;

  // 2. Fallback for Rarity (Prevents crash if rarity is missing/unknown)
  const rarityKey = badge.rarity ?? 'common';
  const rarityConfig = BADGE_RARITY_CONFIG[rarityKey] || BADGE_RARITY_CONFIG.common;

  const isLocked = !badge.isEarned;
  const gradientColors = isLocked ? LOCKED_BADGE_GRADIENT : rarityConfig.gradient;

  // 3. Robust Date Formatting
  const formatEarnedDate = (dateVal: any) => {
    try {
      if (!dateVal) return '';
      const date = new Date(dateVal);
      return isNaN(date.getTime())
        ? 'Recently'
        : date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* 4. Use a Pressable background to allow closing when clicking outside the card */}
      <Pressable
        className="flex-1 items-center justify-center bg-[#2B2A3D]/60 px-5"
        onPress={onClose}>
        {/* StopPropagation equivalent: Wrap content in a Pressable that does nothing */}
        <Pressable
          className="max-h-[85%] w-full rounded-3xl border-2 border-[#EEE9DC] bg-[#FFFDF8] p-5"
          onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 text-lg font-bold text-[#2B2A3D]">{badge.name}</Text>
            <AnimatedPressable
              onPress={onClose}
              className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-[#F6F3EA]">
              <X size={16} color={theme.inkSoft} />
            </AnimatedPressable>
          </View>

          <View className="mt-4 items-center">
            {badge.iconUrl ? (
              <View className="h-20 w-20 overflow-hidden rounded-2xl border border-[#EEE9DC] bg-white">
                <AppImage source={{ uri: badge.iconUrl }} className="h-full w-full" contentFit="cover" />
              </View>
            ) : (
              <LinearGradient
                colors={gradientColors as GradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16 }}
                className="h-20 w-20 items-center justify-center">
                <Icon size={36} color="white" />
              </LinearGradient>
            )}

            <View
              className={`mt-3 flex-row items-center rounded-full px-3 py-1 ${
                isLocked ? 'bg-[#F6F3EA]' : 'bg-[#F1FBF5]'
              }`}>
              <Text className="text-xs">{isLocked ? '🔒' : '⭐'}</Text>
              <Text
                className={`ml-1 text-xs font-semibold ${isLocked ? 'text-[#6B6A80]' : 'text-[#3FB87F]'}`}>
                {isLocked ? 'Locked' : 'Earned'}
              </Text>
            </View>
          </View>

          <ScrollView
            className="mt-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }} // Extra space at bottom of scroll
          >
            <View className="rounded-2xl bg-[#F6F3EA] p-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-[#6B6A80]">
                Rarity
              </Text>
              <Text className="mt-1 text-sm font-semibold text-[#2B2A3D]">
                {rarityConfig.label}
              </Text>
            </View>

            <View className="mt-3 rounded-2xl bg-[#F6F3EA] p-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-[#6B6A80]">
                How to Earn
              </Text>
              <Text className="mt-1 text-sm leading-5 text-[#2B2A3D]">
                {badge.description?.trim() ||
                  'Complete the related learning challenge to unlock this badge.'}
              </Text>
            </View>

            {badge.earnedAt ? (
              <View className="mt-3 rounded-2xl bg-[#F1FBF5] p-4">
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#3FB87F]">
                  Earned On
                </Text>
                <Text className="mt-1 text-sm font-semibold text-[#3FB87F]">
                  {formatEarnedDate(badge.earnedAt)}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
