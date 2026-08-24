import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { Text, View } from 'react-native';

type Ref = BottomSheetModal;

const ThemeSheet = forwardRef<Ref>((_, ref) => {
  return (
    <CustomBottomSheetModal ref={ref} snapPoints={['40%']} enableDynamicSizing={false}>
      <BottomSheetView className="px-6 py-4">
        <Text className="mb-4 text-xl font-bold text-[#2B2A3D]">Theme</Text>

        {['Light', 'Dark', 'Auto'].map((t) => (
          <View key={t} className="mb-3 rounded-xl border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4">
            <Text className="font-semibold text-[#2B2A3D]">{t}</Text>
          </View>
        ))}
      </BottomSheetView>
    </CustomBottomSheetModal>
  );
});

ThemeSheet.displayName = 'ThemeSheet';

export default ThemeSheet;
