import { BaseCard } from '@/components/BaseCard';
import { GamificationMobileUiConfig } from '@/features/gamification/shared/types/gamificationUiConfig';
import { Badge } from '@/features/gamification/shared/types/levelAndbadge';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { BadgeCard } from './BadgeCard';

type BadgeItem = Badge & { isEarned: boolean };

interface BadgesTabProps {
  badges: BadgeItem[];
  config: GamificationMobileUiConfig;
  onSelectBadge: (badgeId: string) => void;
}

export function BadgesTab({ badges, config, onSelectBadge }: BadgesTabProps) {
  const orderedBadges = useMemo(
    () =>
      [...badges].sort((a, b) => {
        if (a.isEarned !== b.isEarned) return a.isEarned ? -1 : 1;
        if (!!a.earnedAt && !!b.earnedAt) {
          return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
        }
        return a.name.localeCompare(b.name);
      }),
    [badges]
  );

  const earnedCount = orderedBadges.filter((badge) => badge.isEarned).length;
  const lockedCount = Math.max(0, orderedBadges.length - earnedCount);

  return (
    <BaseCard className="border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4" padding="none">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-[#2B2A3D]">{config.badgeSectionTitle}</Text>
          <Text className="mt-1 text-sm text-[#6B6A80]">
            Tap a badge card to see full details and unlock criteria.
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        <View className="flex-1 rounded-xl bg-[#F1FBF5] px-3 py-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-[#3FB87F]">Earned</Text>
          <Text className="mt-1 text-lg font-bold text-[#3FB87F]">{earnedCount}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-[#F6F3EA] px-3 py-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-[#6B6A80]">Locked</Text>
          <Text className="mt-1 text-lg font-bold text-[#2B2A3D]">{lockedCount}</Text>
        </View>
      </View>

      <View className="mt-4">
        {orderedBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} onPress={() => onSelectBadge(badge.id)} />
        ))}
      </View>
    </BaseCard>
  );
}
