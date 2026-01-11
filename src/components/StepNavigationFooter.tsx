import AnimatedPressable from '@/components/AnimatedPressable';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  previousLabel?: string;
  nextLabel?: string;
  onPrevious?: () => void;
  onNext: () => void;
  disableNext?: boolean;
}

export function StepNavigationFooter({
  previousLabel = 'Previous',
  nextLabel = 'Next',
  onPrevious,
  onNext,
  disableNext = false,
}: Props) {
  return (
    <View className="absolute bottom-0 w-full flex-row justify-between gap-3 border-t border-slate-100 bg-white p-5 pb-8">
      {/* Previous Button */}
      {onPrevious && (
        <AnimatedPressable
          onPress={onPrevious}
          // Changed p-4 to py-4 to match the Next button
          className="flex-1 items-center justify-center rounded-2xl bg-slate-200 py-4 shadow-sm">
          <Text className="text-base font-black text-slate-700">{previousLabel}</Text>
        </AnimatedPressable>
      )}

      {/* Next Button */}
      <AnimatedPressable
        onPress={onNext}
        disabled={disableNext}
        className={`flex-[2] items-center justify-center rounded-2xl py-4 shadow-xl ${
          disableNext ? 'bg-slate-300' : 'bg-teal-600 shadow-teal-600/20'
        }`}>
        <Text
          className={`text-center text-base font-bold ${
            disableNext ? 'text-slate-500' : 'text-white'
          }`}>
          {nextLabel}
        </Text>
      </AnimatedPressable>
    </View>
  );
}
