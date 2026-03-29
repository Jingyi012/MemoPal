import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { usePrivacyPolicyConfig } from '@/hooks/usePrivacyPolicyConfig';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Ref = BottomSheetModal;

const PrivacyPolicySheet = forwardRef<Ref>((_, ref) => {
  const insets = useSafeAreaInsets();
  const { config } = usePrivacyPolicyConfig();

  return (
    <CustomBottomSheetModal ref={ref} snapPoints={['95%']} enableDynamicSizing={false}>
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        {/* Header */}
        <Text className="mb-3 px-6 pt-4 text-xl font-bold">{config.title}</Text>

        {/* Scrollable Content */}
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          {config.sections.map((section, index) => (
            <View key={`${index}-${section.heading}`} className="mb-3">
              <Text className="mb-2 text-lg font-semibold">{section.heading}</Text>
              <Text className="text-sm text-slate-600">{section.body}</Text>
            </View>
          ))}
        </BottomSheetScrollView>
      </View>
    </CustomBottomSheetModal>
  );
});

PrivacyPolicySheet.displayName = 'PrivacyPolicySheet';

export default PrivacyPolicySheet;
