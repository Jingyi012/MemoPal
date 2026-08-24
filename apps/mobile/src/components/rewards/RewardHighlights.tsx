import { cn } from '@/utils/cn';
import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  levelUpTo?: number;
  milestones?: string[];
  badges?: string[];
  className?: string;
  maxItemsPerType?: number;
};

export function RewardHighlights({
  levelUpTo,
  milestones = [],
  badges = [],
  className,
  maxItemsPerType = 2,
}: Props) {
  const visibleMilestones = milestones.slice(0, Math.max(0, maxItemsPerType));
  const visibleBadges = badges.slice(0, Math.max(0, maxItemsPerType));
  const hasContent = !!levelUpTo || visibleMilestones.length > 0 || visibleBadges.length > 0;

  if (!hasContent) return null;

  return (
    <View className={cn('rounded-2xl bg-[#FFF7E0] p-4', className)}>
      <Text className="text-sm font-bold text-[#F2A900]">Rewards Unlocked</Text>

      {levelUpTo ? (
        <Text className="mt-2 text-xs font-semibold text-[#F2A900]">Level Up: Level {levelUpTo}</Text>
      ) : null}

      {visibleMilestones.map((item) => (
        <Text key={`milestone-${item}`} className="mt-1 text-xs text-[#F2A900]">
          Milestone: {item}
        </Text>
      ))}

      {visibleBadges.map((item) => (
        <Text key={`badge-${item}`} className="mt-1 text-xs text-[#F2A900]">
          Badge: {item}
        </Text>
      ))}
    </View>
  );
}
