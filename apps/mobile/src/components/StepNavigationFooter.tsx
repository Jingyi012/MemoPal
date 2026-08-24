import AnimatedPressable from '@/components/AnimatedPressable';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  return (
    <View
      className="w-full flex-row justify-between gap-3 border-t-2 border-[#EEE9DC] bg-white p-5"
      style={{ paddingBottom: Math.max(12, insets.bottom + 8) }}>
      {/* Previous Button */}
      {onPrevious && (
        <AnimatedPressable
          onPress={onPrevious}
          // Changed p-4 to py-4 to match the Next button
          className="flex-1 items-center justify-center rounded-2xl bg-[#F6F3EA] py-4 shadow-sm">
          <Text className="text-base font-black text-[#6B6A80]">{previousLabel}</Text>
        </AnimatedPressable>
      )}

      {/* Next Button */}
      <AnimatedPressable
        onPress={onNext}
        disabled={disableNext}
        className={`flex-[2] items-center justify-center rounded-2xl py-4 shadow-xl ${
          disableNext ? 'bg-[#D8D4C9]' : 'bg-[#FFC93C] shadow-[#F2A900]/20'
        }`}>
        <Text
          className={`text-center text-base font-bold ${
            disableNext ? 'text-[#9A97A7]' : 'text-[#2B2A3D]'
          }`}>
          {nextLabel}
        </Text>
      </AnimatedPressable>
    </View>
  );
}
