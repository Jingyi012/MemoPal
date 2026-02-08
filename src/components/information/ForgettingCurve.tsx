import { cn } from '@/utils/cn';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  className?: string;
}

export const ForgettingCurveCard: React.FC<Props> = ({ className }) => {
  return (
    <View className={cn('rounded-2xl border-teal-200 bg-teal-50 p-5 shadow-sm', className)}>
      {/* Title */}
      <Text className="mb-3 text-lg text-teal-900">📚 The Forgetting Curve</Text>

      {/* Bullet points */}
      <View className="space-y-2">
        <Text className="text-sm text-teal-700">• After 24h: 70% forgotten without review</Text>
        <Text className="text-sm text-teal-700">• After 3 days: 80% forgotten</Text>
        <Text className="text-sm text-teal-700">• After 7 days: 90% forgotten</Text>
        <Text className="text-sm text-teal-700">• After 30 days: Only 10% retained</Text>
      </View>

      {/* Footer note */}
      <Text className="mt-3 text-xs text-teal-600">
        Each review strengthens your memory and slows down forgetting!
      </Text>
    </View>
  );
};
