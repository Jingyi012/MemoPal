import { GamificationMobileUiConfig } from '@/types/missions';
import { Badge } from '@/types/levelAndbadge';
import React from 'react';
import { Text, View } from 'react-native';
import { BadgeCard } from './BadgeCard';

type BadgeItem = Badge & { isEarned: boolean };

interface BadgesTabProps {
  badges: BadgeItem[];
  config: GamificationMobileUiConfig;
  onSelectBadge: (badgeId: string) => void;
}

export function BadgesTab({ badges, config, onSelectBadge }: BadgesTabProps) {
  return (
    <View className="rounded-2xl bg-white p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-slate-900">{config.badgeSectionTitle}</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Tap a badge to see full details and unlock criteria.
          </Text>
        </View>
      </View>

      <View className="-mx-1.5 mt-4 flex-row flex-wrap">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} onPress={() => onSelectBadge(badge.id)} />
        ))}
      </View>
    </View>
  );
}
