import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { X, Zap } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

interface Props {
  currentStep: number;
  totalSteps: number;
  streak: number;
  streakStyle: any;
  onExit: () => void;
}

export const ReviewHeader: React.FC<Props> = ({
  currentStep,
  totalSteps,
  streak,
  streakStyle,
  onExit,
}) => (
  <View className="z-20 flex-row items-center justify-between px-6 pt-6">
    <View className="mr-4 flex-1">
      <View className="h-2 overflow-hidden rounded-full bg-slate-200">
        <Animated.View
          className="h-full bg-teal-500"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </View>
    </View>

    <Animated.View
      style={streakStyle}
      className="flex-row items-center rounded-full border border-orange-200 bg-orange-100 px-3 py-1">
      <Zap size={16} color="#f97316" fill="#f97316" />
      <Text className="ml-1 font-black text-orange-600">{streak}</Text>
    </Animated.View>

    <AnimatedPressable onPress={onExit} className="ml-4 rounded-full bg-white p-2 shadow-sm">
      <X size={20} color={Colors.gray600} />
    </AnimatedPressable>
  </View>
);
