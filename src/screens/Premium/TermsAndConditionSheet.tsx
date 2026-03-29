import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { PremiumSubscriptionConfig } from '@/types/premiumSubscriptionConfig';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
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
          <Text className="text-2xl font-bold text-slate-900">{terms.title}</Text>
          <TouchableOpacity onPress={handleDismissTerms} className="rounded-full bg-slate-100 p-2">
            <X size={20} color="#64748b" />
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
          className="mt-4 rounded-xl bg-slate-900 py-4">
          <Text className="text-center font-bold text-white">{terms.closeButtonLabel}</Text>
        </TouchableOpacity>
      </View>
    </CustomBottomSheetModal>
  );
});

TermsAndConditionSheet.displayName = 'TermsAndConditionSheet';

const TermSection = ({ number, title, body }: { number: string; title: string; body: string }) => (
  <View className="flex-row gap-3">
    <View className="h-6 w-6 items-center justify-center rounded-full bg-orange-100">
      <Text className="text-xs font-bold text-orange-600">{number}</Text>
    </View>
    <View className="flex-1">
      <Text className="mb-1 font-bold text-slate-900">{title}</Text>
      <Text className="text-sm leading-5 text-slate-500">{body}</Text>
    </View>
  </View>
);

export default TermsAndConditionSheet;
