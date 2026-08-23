import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { BookOpen } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export const StartLearningCard: React.FC<{ wordCount: number; onStartLearning: () => void }> = ({
  onStartLearning,
  wordCount,
}) => (
  <View className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
    <View className="mb-3 flex-row items-center gap-4">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <BookOpen size={24} color={Colors.blue600} />
      </View>
      <View className="flex-1">
        <Text className="mb-1 font-semibold text-blue-900">Start Learning</Text>
        <Text className="text-sm text-blue-700">Encode {wordCount} words into your palace</Text>
      </View>
    </View>
    <AnimatedPressable onPress={onStartLearning} className="rounded-xl bg-blue-600 py-3">
      <Text className="text-center font-semibold text-white">Start Learning</Text>
    </AnimatedPressable>
  </View>
);
