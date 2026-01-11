import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { Trophy } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  onPracticeAgain: () => void;
}

export const MasteredCard: React.FC<Props> = ({ onPracticeAgain }) => {
  return (
    <View className="rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-5">
      <View className="mb-3 flex-row items-center gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <Trophy size={24} color={Colors.yellow600} />
        </View>

        <View className="flex-1">
          <Text className="mb-1 font-semibold text-yellow-900">Lesson Mastered!</Text>
          <Text className="text-sm text-yellow-700">
            All reviews completed. Locked into long-term memory 🎉
          </Text>
        </View>
      </View>

      <AnimatedPressable onPress={onPracticeAgain} className="rounded-xl bg-yellow-600 py-3">
        <Text className="text-center font-semibold text-white">Practice Again (Optional)</Text>
      </AnimatedPressable>
    </View>
  );
};
