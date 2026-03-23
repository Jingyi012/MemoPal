import { GamificationMobileUiConfig } from '@/types/missions';
import { Milestone } from '@/types/levelAndbadge';
import React from 'react';
import { Text, View } from 'react-native';
import { MilestoneItem } from './MilestoneItem';

type MilestoneWithProgress = Milestone & {
  isLocked: boolean;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  remaining: number;
};

interface MilestonesTabProps {
  milestoneGroups: readonly (readonly [string, MilestoneWithProgress[]])[];
  config: GamificationMobileUiConfig;
}

export function MilestonesTab({ milestoneGroups, config }: MilestonesTabProps) {
  return (
    <View className="rounded-2xl bg-white p-4">
      <Text className="text-base font-bold text-slate-900">{config.milestoneSectionTitle}</Text>
      <Text className="mt-1 text-sm text-slate-500">
        Progress updates automatically as you learn and review.
      </Text>

      <View className="mt-4 gap-4">
        {milestoneGroups.map(([conditionType, items]) => {
          const label =
            config.milestoneTypeLabels?.[conditionType] ?? conditionType.replaceAll('_', ' ');
          return (
            <View key={conditionType}>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {label}
              </Text>
              <View className="gap-2">
                {items.map((milestone, index) => (
                  <MilestoneItem
                    key={milestone.id}
                    milestone={milestone}
                    showConnector={index < items.length - 1}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
