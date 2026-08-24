import { BaseCard } from '@/components/BaseCard';
import { GamificationMobileUiConfig } from '@/features/gamification/shared/types/gamificationUiConfig';
import { Milestone } from '@/features/gamification/shared/types/levelAndbadge';
import React, { useState } from 'react';
import { LayoutAnimation, Text, View } from 'react-native';
import { MilestoneItem } from './MilestoneItem';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import AnimatedPressable from '@/components/AnimatedPressable';

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
  // Track expanded groups. Initialize with the first one open.
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    [milestoneGroups[0]?.[0]]: true,
  });

  const toggleGroup = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <BaseCard className="border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4" padding="none">
      <View className="mb-4">
        <Text className="text-base font-bold text-[#2B2A3D]">{config.milestoneSectionTitle}</Text>
        <Text className="mt-1 text-sm text-[#6B6A80]">
          Progress updates automatically as you learn and review.
        </Text>
      </View>

      <View className="gap-3">
        {milestoneGroups.map(([conditionType, items]) => {
          const isExpanded = !!expandedGroups[conditionType];
          const label =
            config.milestoneTypeLabels?.[conditionType] ?? conditionType.replaceAll('_', ' ');
          const achievedCount = items.filter((i) => !i.isLocked).length;

          return (
            <View
              key={conditionType}
              className="overflow-hidden rounded-xl border-2 border-[#EEE9DC]">
              {/* Accordion Header */}
              <AnimatedPressable
                onPress={() => toggleGroup(conditionType)}
                className={`flex-row items-center justify-between p-4 ${isExpanded ? 'bg-[#F6F3EA]' : 'bg-white'}`}>
                <View>
                  <Text className="text-xs font-bold uppercase tracking-widest text-[#6B6A80]">
                    {label}
                  </Text>
                  <Text className="text-xs text-[#9A97A7]">
                    {achievedCount} of {items.length} completed
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={18} color="#7A68E0" />
                ) : (
                  <ChevronDown size={18} color="#7A68E0" />
                )}
              </AnimatedPressable>

              {/* Accordion Content */}
              {isExpanded && (
                <View className="gap-4 bg-[#FFFDF8] p-4 pt-2">
                  {items.map((milestone, index) => (
                    <MilestoneItem
                      key={milestone.id}
                      milestone={milestone}
                      showConnector={index < items.length - 1}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </BaseCard>
  );
}
