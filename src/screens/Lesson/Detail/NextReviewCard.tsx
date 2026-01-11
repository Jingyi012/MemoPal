import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { Clock } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  isOverdue: boolean;
  isDueSoon: boolean;
  nextReviewText: string;
  onStartReview: () => void;
}

export const NextReviewCard: React.FC<Props> = ({
  isOverdue,
  isDueSoon,
  nextReviewText,
  onStartReview,
}) => {
  const containerStyle = isOverdue
    ? 'bg-red-50 border-red-200'
    : isDueSoon
      ? 'bg-orange-50 border-orange-200'
      : 'bg-blue-50 border-blue-200';

  const iconBg = isOverdue ? 'bg-red-100' : isDueSoon ? 'bg-orange-100' : 'bg-blue-100';

  const textColor = isOverdue ? 'text-red-900' : isDueSoon ? 'text-orange-900' : 'text-blue-900';

  const subTextColor = isOverdue ? 'text-red-700' : isDueSoon ? 'text-orange-700' : 'text-blue-700';

  const buttonBg = isOverdue ? 'bg-red-600' : isDueSoon ? 'bg-orange-600' : 'bg-blue-600';

  const iconColor = isOverdue
    ? Colors.red700 // red-700
    : isDueSoon
      ? Colors.orange700 // orange-700
      : Colors.blue700; // blue-700

  return (
    <View className={`rounded-2xl border-2 p-5 ${containerStyle}`}>
      <View className="mb-4 flex-row items-start gap-4">
        <View className={`h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
          <Clock color={iconColor} size={24} />
        </View>

        <View className="flex-1">
          <Text className={`mb-1 font-semibold ${textColor}`}>
            {isOverdue ? 'Review Overdue!' : isDueSoon ? 'Review Due Soon' : 'Next Review'}
          </Text>
          <Text className={`text-sm ${subTextColor}`}>{nextReviewText}</Text>
        </View>
      </View>

      <AnimatedPressable onPress={onStartReview} className={`rounded-xl py-3 ${buttonBg}`}>
        <Text className="text-center font-semibold text-white">Start Review Now</Text>
      </AnimatedPressable>
    </View>
  );
};
