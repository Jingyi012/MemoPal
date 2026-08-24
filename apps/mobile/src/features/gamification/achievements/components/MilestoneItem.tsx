import { Milestone } from '@/features/gamification/shared/types/levelAndbadge';
import { CheckCircle2, Lock } from 'lucide-react-native';
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
            isAchieved ? 'bg-emerald-500' : 'border border-indigo-300 bg-white'
          }`}
        />
        {showConnector ? (
          <View className={`mt-1 w-0.5 flex-1 ${isAchieved ? 'bg-emerald-200' : 'bg-slate-200'}`} />
        ) : null}
      </View>

      <View className={`flex-1 rounded-2xl bg-white p-4 ${isAchieved ? 'border border-emerald-100' : ''}`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className={`text-sm font-semibold ${isAchieved ? 'text-emerald-800' : 'text-slate-800'}`}>
              {milestone.title}
            </Text>
            {!!milestone.description && (
              <Text className="mt-1 text-sm leading-5 text-slate-500">{milestone.description}</Text>
            )}
          </View>
          {isAchieved ? (
            <View className="rounded-full bg-emerald-100 p-1.5">
              <CheckCircle2 size={16} color="#15803d" />
            </View>
          ) : (
            <View className="rounded-full bg-slate-100 p-1.5">
              <Lock size={14} color="#64748b" />
            </View>
          )}
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-500">
            {milestone.currentValue}/{milestone.targetValue}
          </Text>
          <Text className={`text-sm font-semibold ${isAchieved ? 'text-emerald-700' : 'text-slate-500'}`}>
            {isAchieved ? 'Achieved' : `${milestone.remaining} to go`}
          </Text>
        </View>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <View
            className={`h-full ${isAchieved ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            style={{ width: `${milestone.progressPercent}%` }}
          />
        </View>
      </View>
    </View>
  );
};
