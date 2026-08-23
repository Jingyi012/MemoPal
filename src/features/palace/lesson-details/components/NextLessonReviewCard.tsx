/** Temporary adapter for the next review card. */
import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { AlertCircle, Clock, Zap } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  isDue: boolean;
  isOverdue: boolean;
  isDueSoon: boolean;
  nextReviewText: string;
  onStartReview: () => void;
}

export const NextReviewCard: React.FC<Props> = ({
  isDue,
  isOverdue,
  isDueSoon,
  nextReviewText,
  onStartReview,
}) => {
  if (isDue || isOverdue) {
    const theme = isOverdue
      ? {
          container: 'bg-red-50 border-red-100',
          iconBg: 'bg-red-500',
          button: 'bg-red-600',
          text: 'text-red-900',
          subText: 'text-red-600/80',
          icon: <AlertCircle color="white" size={24} strokeWidth={2.5} />,
          label: 'Overdue',
        }
      : {
          container: 'bg-indigo-50 border-indigo-100',
          iconBg: 'bg-indigo-500',
          button: 'bg-indigo-600',
          text: 'text-indigo-900',
          subText: 'text-indigo-600/80',
          icon: <Zap color="white" size={24} fill="white" />,
          label: 'Ready to Review',
        };

    return (
      <View className={`rounded-3xl border-2 p-5 shadow-sm ${theme.container}`}>
        <View className="mb-5 flex-row items-center gap-4">
          <View
            className={`h-14 w-14 items-center justify-center rounded-2xl shadow-blue-200 ${theme.iconBg}`}>
            {theme.icon}
          </View>
          <View className="flex-1">
            <Text className={`text-lg font-bold ${theme.text}`}>{theme.label}</Text>
            <Text className={`text-sm font-medium ${theme.subText}`}>
              {isOverdue ? `Missed by ${nextReviewText}` : 'Boost your memory retention now'}
            </Text>
          </View>
        </View>

        <AnimatedPressable
          onPress={onStartReview}
          className={`flex-row items-center justify-center rounded-2xl py-4 shadow-lg ${theme.button}`}>
          <Text className="mr-2 text-center text-lg font-bold text-white">Start Session</Text>
          <Zap size={18} color="white" fill="white" />
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View
            className={`h-12 w-12 items-center justify-center rounded-2xl ${isDueSoon ? 'bg-orange-100' : 'bg-slate-100'}`}>
            <Clock color={isDueSoon ? Colors.orange600 : Colors.slate500} size={22} />
          </View>
          <View>
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Next Review
            </Text>
            <Text
              className={`text-lg font-bold ${isDueSoon ? 'text-orange-900' : 'text-slate-900'}`}>
              {nextReviewText}
            </Text>
          </View>
        </View>

        {isDueSoon && (
          <View className="rounded-full bg-orange-500 px-3 py-1">
            <Text className="text-xs font-bold uppercase text-white">Soon</Text>
          </View>
        )}
      </View>

      {!isDueSoon && (
        <View className="mt-4 border-t border-slate-50 pt-4">
          <Text className="text-xs italic text-slate-400">
            Your memory is currently strong. Check back later!
          </Text>
        </View>
      )}
    </View>
  );
};
