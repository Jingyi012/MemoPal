import { Colors } from '@/constants/colors';
import { ReviewSchedule } from '@/types/lesson';
import { cn } from '@/utils/cn';
import { Check, Lock } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  schedule: ReviewSchedule[]; // Only includes completed + current active
  className?: string;
}

// Define your SRS strategy labels upfront
const SRS_STAGES = [
  { label: '24h', round: 1 },
  { label: '3d', round: 2 },
  { label: '7d', round: 3 },
  { label: '30d', round: 4 },
];

export function ReviewProgressIndicator({ schedule, className }: Props) {
  // Find the highest round number reached so far
  const completedRounds = schedule.filter((s) => s.completed).length;
  const currentActiveReview = schedule.find((s) => !s.completed);

  // The user is currently "at" this index in the SRS_STAGES array
  const currentStageIndex = currentActiveReview
    ? currentActiveReview.reviewRound - 1
    : completedRounds;

  return (
    <>
      <View className={cn('rounded-3xl border border-slate-100 bg-white p-6 shadow-sm', className)}>
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-slate-900">Mastery Path</Text>
            <Text className="text-xs font-medium text-slate-500">
              {completedRounds} of {SRS_STAGES.length} stages cleared
            </Text>
          </View>
          <View className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1">
            <Text className="text-[10px] font-bold uppercase text-blue-600">
              Stage {completedRounds + 1}
            </Text>
          </View>
        </View>

        <View className="flex-row items-start justify-between">
          {SRS_STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isActive = index === currentStageIndex;
            const isLocked = index > currentStageIndex;

            return (
              <View key={stage.label} className="flex-1 items-center">
                {/* Connecting Line */}
                {index !== 0 && (
                  <View
                    className={cn(
                      'absolute -left-1/2 right-1/2 top-4 -z-10 h-[2px]',
                      isCompleted ? 'bg-green-400' : 'bg-slate-100'
                    )}
                  />
                )}

                {/* Step Circle */}
                <View
                  className={cn(
                    'h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm',
                    isCompleted
                      ? 'border-green-500 bg-green-500'
                      : isActive
                        ? 'border-blue-500 bg-white shadow-blue-200'
                        : 'border-slate-200 bg-slate-50'
                  )}>
                  {isCompleted ? (
                    <Check size={18} color="white" strokeWidth={3} />
                  ) : isLocked ? (
                    <Lock size={14} color={Colors.slate400} />
                  ) : (
                    <View className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
                  )}
                </View>

                {/* Label */}
                <Text
                  className={cn(
                    'mt-3 text-[10px] font-bold uppercase tracking-tighter',
                    isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-slate-400'
                  )}>
                  {stage.label}
                </Text>

                {/* Status Dot for Active */}
                {isActive && <View className="mt-1 h-1 w-1 rounded-full bg-blue-500" />}
              </View>
            );
          })}
        </View>

        {/* Motivational Footer */}
        <View className="mt-6 flex-row items-center rounded-2xl bg-slate-50 p-3">
          <View className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
            <View
              className="h-full bg-green-500"
              style={{ width: `${(completedRounds / SRS_STAGES.length) * 100}%` }}
            />
          </View>
          <Text className="ml-3 text-[10px] font-bold text-slate-500">
            {Math.round((completedRounds / SRS_STAGES.length) * 100)}% Mastered
          </Text>
        </View>
      </View>
    </>
  );
}
