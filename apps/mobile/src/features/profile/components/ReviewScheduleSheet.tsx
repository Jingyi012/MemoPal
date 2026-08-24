import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { forwardRef, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReviewScheduleSheetProps {
  currentTime: string;
  onSave: (time: string) => void;
}

type Ref = BottomSheetModal;

export const ReviewScheduleSheet = forwardRef<Ref, ReviewScheduleSheetProps>(
  ({ currentTime, onSave }, ref) => {
    const insets = useSafeAreaInsets();

    const times = useMemo(() => {
      return Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return `${hour}:00`;
      });
    }, []);

    const handleDismiss = () => {
      if (ref && 'current' in ref) {
        ref.current?.dismiss();
      }
    };

    return (
      <CustomBottomSheetModal ref={ref} snapPoints={['90%']} enableDynamicSizing={false}>
        {/* Header */}
        <View className="z-10 bg-white px-6 pb-2 pt-3">
          <Text className="text-xl font-bold text-[#2B2A3D]">Daily Learning Time</Text>
          <Text className="text-sm text-[#6B6A80]">
            Select the hour for your daily learning reminder
          </Text>
        </View>

        {/* Scrollable List */}
        <BottomSheetFlatList
          data={times}
          keyExtractor={(item: string) => item}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 16, // leave space for footer
            paddingTop: 8,
          }}
          renderItem={({
            item,
          }: {
            item: string; //time
            index: number;
          }) => {
            const isSelected = item === currentTime;
            return (
              <AnimatedPressable
                onPress={() => {
                  onSave(item);
                  handleDismiss();
                }}
                className={`mb-2 w-full items-center rounded-xl border py-4 ${
                  isSelected ? 'border-2 border-[#DCD4FF] bg-[#EEE9FF]' : 'border-2 border-transparent bg-[#F6F3EA]'
                }`}>
                <Text
                  className={`text-lg ${
                    isSelected ? 'font-bold text-[#7A68E0]' : 'font-medium text-[#6B6A80]'
                  }`}>
                  {item}
                </Text>
              </AnimatedPressable>
            );
          }}
        />

        {/* Fixed Footer */}
        <View
          className="border-t-2 border-[#EEE9DC] bg-white px-6 py-4"
          style={{ paddingBottom: insets.bottom }}>
          <AnimatedPressable
            onPress={handleDismiss}
            className="w-full items-center rounded-xl bg-[#F6F3EA] py-4">
            <Text className="text-base font-semibold text-[#6B6A80]">Cancel</Text>
          </AnimatedPressable>
        </View>
      </CustomBottomSheetModal>
    );
  }
);

ReviewScheduleSheet.displayName = 'ReviewScheduleSheet';
