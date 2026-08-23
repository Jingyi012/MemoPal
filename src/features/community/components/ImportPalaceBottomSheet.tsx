import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { Palace } from '@/features/palace';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef } from 'react';
import { Text, View } from 'react-native';

type Ref = BottomSheetModal;

interface Props {
  palaces: Palace[];
  requiredWordCount: number;
  isImporting: boolean;
  onSelectPalace: (palaceId: string) => void;
}

const ImportPalaceBottomSheet = forwardRef<Ref, Props>(
  ({ palaces, requiredWordCount, isImporting, onSelectPalace }, ref) => {
    return (
      <CustomBottomSheetModal ref={ref} snapPoints={['60%', '85%']} enableDynamicSizing={false}>
        <View className="flex-1">
          <View className="border-b border-slate-200 px-6 pb-4 pt-3">
            <Text className="text-xl font-extrabold text-slate-900">Import To Palace</Text>
            <Text className="mt-1 text-sm text-slate-500">
              Choose where this community lesson should be stored.
            </Text>
          </View>

          <BottomSheetScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {palaces.length === 0 ? (
              <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="font-semibold text-amber-700">No unlocked palace available.</Text>
                <Text className="mt-1 text-sm text-amber-700">
                  Unlock or create a palace first before importing lessons.
                </Text>
              </View>
            ) : (
              palaces.map((palace) => {
                const hasEnoughLocations = palace.locationsCount >= requiredWordCount;
                const isDisabled = isImporting || !hasEnoughLocations;

                return (
                  <AnimatedPressable
                    key={palace.id}
                    onPress={() => onSelectPalace(palace.id)}
                    disabled={isDisabled}
                    className={`mb-3 rounded-2xl border p-4 ${
                      isDisabled ? 'border-slate-100 bg-slate-100' : 'border-slate-200 bg-white'
                    }`}>
                    <Text className="text-base font-bold text-slate-900">{palace.name}</Text>
                    <Text className="mt-1 text-sm text-slate-600" numberOfLines={2}>
                      {palace.description}
                    </Text>
                    <Text className="mt-2 text-xs font-semibold uppercase text-teal-700">
                      {palace.locationsCount} locations
                    </Text>
                    {!hasEnoughLocations && requiredWordCount > 0 && (
                      <Text className="mt-1 text-xs font-medium text-amber-700">
                        Needs at least {requiredWordCount} locations for this lesson.
                      </Text>
                    )}
                  </AnimatedPressable>
                );
              })
            )}
          </BottomSheetScrollView>
        </View>
      </CustomBottomSheetModal>
    );
  }
);

ImportPalaceBottomSheet.displayName = 'ImportPalaceBottomSheet';

export default ImportPalaceBottomSheet;
