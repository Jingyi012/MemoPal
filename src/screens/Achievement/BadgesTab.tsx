import { GamificationMobileUiConfig } from '@/types/missions';
import { Badge } from '@/types/levelAndbadge';
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
    <View className="rounded-2xl bg-white p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-slate-900">{config.badgeSectionTitle}</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Tap a badge card to see full details and unlock criteria.
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        <View className="flex-1 rounded-xl bg-emerald-50 px-3 py-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Earned</Text>
          <Text className="mt-1 text-lg font-bold text-emerald-700">{earnedCount}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-slate-100 px-3 py-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-600">Locked</Text>
          <Text className="mt-1 text-lg font-bold text-slate-800">{lockedCount}</Text>
        </View>
      </View>

      <View className="mt-4">
        {orderedBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} onPress={() => onSelectBadge(badge.id)} />
        ))}
      </View>
    </View>
  );
}
