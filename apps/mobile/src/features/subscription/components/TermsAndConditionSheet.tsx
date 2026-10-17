import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { PremiumSubscriptionConfig } from '@/features/subscription/types/premiumSubscriptionConfig';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { X } from '@/core/icons';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Ref = BottomSheetModal;
type TermsConfig = PremiumSubscriptionConfig['terms'];

interface TermsAndConditionSheetProps {
  terms: TermsConfig;
}

const TermsAndConditionSheet = forwardRef<Ref, TermsAndConditionSheetProps>(({ terms }, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => bottomSheetRef.current!, []);
  const handleDismissTerms = () => {
    bottomSheetRef.current?.dismiss();
  };
  return (
    <CustomBottomSheetModal ref={bottomSheetRef} snapPoints={['95%']} enableDynamicSizing={false}>
      <View className="flex-1 px-6 pb-8 pt-2">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-[#2B2A3D]">{terms.title}</Text>
          <TouchableOpacity onPress={handleDismissTerms} className="rounded-full bg-tint-peach p-2">
            <X size={20} color="#6B6A80" />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-y-6 pb-6">
            {terms.sections.map((section, index) => (
              <TermSection
                key={`${section.title}-${index + 1}`}
                number={String(index + 1)}
                title={section.title}
                body={section.body}
              />
            ))}
          </View>
        </BottomSheetScrollView>

        <TouchableOpacity
          onPress={handleDismissTerms}
          className="mt-4 rounded-xl bg-primary py-4">
          <Text className="text-center font-bold text-white">{terms.closeButtonLabel}</Text>
        </TouchableOpacity>
      </View>
    </CustomBottomSheetModal>
  );
});

TermsAndConditionSheet.displayName = 'TermsAndConditionSheet';

const TermSection = ({ number, title, body }: { number: string; title: string; body: string }) => (
  <View className="flex-row gap-3">
    <View className="h-6 w-6 items-center justify-center rounded-full bg-tint-sun">
      <Text className="text-xs font-bold text-[#F2A900]">{number}</Text>
    </View>
    <View className="flex-1">
      <Text className="mb-1 font-bold text-[#2B2A3D]">{title}</Text>
      <Text className="text-sm leading-5 text-[#6B6A80]">{body}</Text>
    </View>
  </View>
);

export default TermsAndConditionSheet;
