import AnimatedPressable from '@/components/AnimatedPressable';
import { BADGE_RARITY_CONFIG, LOCKED_BADGE_GRADIENT } from '@/constants/badgeRarityConfig';
import { GradientColors } from '@/types/colors';
import { Badge } from '@/types/levelAndbadge';
import { iconMap } from '@/utils/IconMap';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Star, X } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';

interface BadgeDetailsModalProps {
  badge: (Badge & { isEarned: boolean }) | null;
  visible: boolean;
  onClose: () => void;
}

export const BadgeDetailsModal: React.FC<BadgeDetailsModalProps> = ({ badge, visible, onClose }) => {
  if (!badge) return null;

  const Icon = iconMap[badge.icon ?? 'brain'];
  const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity ?? 'common'];
  const isLocked = !badge.isEarned;
  const gradientColors = isLocked ? LOCKED_BADGE_GRADIENT : rarityConfig.gradient;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-slate-900/60 px-5">
        <View className="max-h-[85%] w-full rounded-3xl bg-white p-5">
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 text-lg font-bold text-slate-900">{badge.name}</Text>
            <AnimatedPressable
              onPress={onClose}
              className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <X size={16} color="#334155" />
            </AnimatedPressable>
          </View>

          <View className="mt-4 items-center">
            <LinearGradient
              colors={gradientColors as GradientColors}
              start={[0, 0]}
              end={[1, 0]}
              style={{ borderRadius: 16 }}
              className="h-20 w-20 items-center justify-center">
              <Icon size={36} color="white" />
            </LinearGradient>
            <View
              className={`mt-3 flex-row items-center rounded-full px-3 py-1 ${
                isLocked ? 'bg-slate-100' : 'bg-emerald-50'
              }`}>
              {isLocked ? (
                <Lock size={12} color="#64748b" />
              ) : (
                <Star size={12} color="#15803d" fill="#15803d" />
              )}
              <Text
                className={`ml-1 text-xs font-semibold ${isLocked ? 'text-slate-600' : 'text-emerald-700'}`}>
                {isLocked ? 'Locked' : 'Earned'}
              </Text>
            </View>
          </View>

          <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
            <View className="rounded-2xl bg-slate-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rarity
              </Text>
              <Text className="mt-1 text-sm font-semibold text-slate-800">{rarityConfig.label}</Text>
            </View>

            <View className="mt-3 rounded-2xl bg-slate-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                How to Earn
              </Text>
              <Text className="mt-1 text-sm leading-5 text-slate-700">
                {badge.description?.trim() || 'Complete the related learning challenge to unlock this badge.'}
              </Text>
            </View>

            {badge.earnedAt ? (
              <View className="mt-3 rounded-2xl bg-emerald-50 p-4">
                <Text className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Earned On
                </Text>
                <Text className="mt-1 text-sm font-semibold text-emerald-700">
                  {new Date(badge.earnedAt).toLocaleString()}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
