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
          <Text className="text-xl font-bold text-slate-900">Daily Learning Time</Text>
          <Text className="text-sm text-slate-500">
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
                  isSelected ? 'border-teal-200 bg-teal-50' : 'border-transparent bg-gray-50'
                }`}>
                <Text
                  className={`text-lg ${
                    isSelected ? 'font-bold text-teal-600' : 'font-medium text-slate-700'
                  }`}>
                  {item}
                </Text>
              </AnimatedPressable>
            );
          }}
        />

        {/* Fixed Footer */}
        <View
          className="border-t border-slate-100 bg-white px-6 py-4"
          style={{ paddingBottom: insets.bottom }}>
          <AnimatedPressable
            onPress={handleDismiss}
            className="w-full items-center rounded-xl bg-gray-100 py-4">
            <Text className="text-base font-semibold text-slate-600">Cancel</Text>
          </AnimatedPressable>
        </View>
      </CustomBottomSheetModal>
    );
  }
);
