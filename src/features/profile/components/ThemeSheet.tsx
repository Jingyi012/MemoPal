import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { Text, View } from 'react-native';

type Ref = BottomSheetModal;

const ThemeSheet = forwardRef<Ref>((_, ref) => {
  return (
    <CustomBottomSheetModal ref={ref} snapPoints={['40%']} enableDynamicSizing={false}>
      <BottomSheetView className="px-6 py-4">
        <Text className="mb-4 text-xl font-bold">Theme</Text>

        {['Light', 'Dark', 'Auto'].map((t) => (
          <View key={t} className="mb-3 rounded-xl border border-slate-200 p-4">
            <Text className="font-semibold">{t}</Text>
          </View>
        ))}
      </BottomSheetView>
    </CustomBottomSheetModal>
  );
});

ThemeSheet.displayName = 'ThemeSheet';

export default ThemeSheet;
