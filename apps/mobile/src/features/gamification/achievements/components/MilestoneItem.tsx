import { Milestone } from '@/features/gamification/shared/types/levelAndbadge';
import React from 'react';
import { Text, View } from 'react-native';

interface MilestoneItemProps {
  milestone: Milestone & {
    isLocked: boolean;
    currentValue: number;
    targetValue: number;
    progressPercent: number;
    remaining: number;
  };
  showConnector?: boolean;
}

export const MilestoneItem: React.FC<MilestoneItemProps> = ({ milestone, showConnector = false }) => {
  const isAchieved = !milestone.isLocked;

  return (
    <View className="flex-row">
      <View className="mr-3 w-5 items-center">
        <View
          className={`mt-1 h-3 w-3 rounded-full ${
            isAchieved ? 'bg-[#3FB87F]' : 'border border-[#9B8CFF] bg-white'
          }`}
        />
        {showConnector ? (
          <View className={`mt-1 w-0.5 flex-1 ${isAchieved ? 'bg-[#BFE7D6]' : 'bg-[#EEE9DC]'}`} />
        ) : null}
      </View>

      <View className={`flex-1 rounded-2xl border-2 border-[#EEE9DC] bg-white p-4 ${isAchieved ? 'border-[#BFE7D6]' : ''}`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className={`text-sm font-semibold ${isAchieved ? 'text-[#3FB87F]' : 'text-[#2B2A3D]'}`}>
              {milestone.title}
            </Text>
            {!!milestone.description && (
              <Text className="mt-1 text-sm leading-5 text-[#6B6A80]">{milestone.description}</Text>
            )}
          </View>
          {isAchieved ? (
            <View className="rounded-full bg-[#F1FBF5] p-1.5">
              <Text className="text-base">✅</Text>
            </View>
          ) : (
            <View className="rounded-full bg-[#F6F3EA] p-1.5">
              <Text className="text-sm">🔒</Text>
            </View>
          )}
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-[#6B6A80]">
            {milestone.currentValue}/{milestone.targetValue}
          </Text>
          <Text className={`text-sm font-semibold ${isAchieved ? 'text-[#3FB87F]' : 'text-[#6B6A80]'}`}>
            {isAchieved ? 'Achieved' : `${milestone.remaining} to go`}
          </Text>
        </View>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEE9DC]">
          <View
            className={`h-full ${isAchieved ? 'bg-[#3FB87F]' : 'bg-[#9B8CFF]'}`}
            style={{ width: `${milestone.progressPercent}%` }}
          />
        </View>
      </View>
    </View>
  );
};
