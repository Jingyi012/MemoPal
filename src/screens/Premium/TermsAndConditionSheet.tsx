import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Ref = BottomSheetModal;

const TermsAndConditionSheet = forwardRef<Ref>((_, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => bottomSheetRef.current!, []);
  const handleDismissTerms = () => {
    bottomSheetRef.current?.dismiss();
  };
  return (
    <CustomBottomSheetModal ref={bottomSheetRef} snapPoints={['95%']} enableDynamicSizing={false}>
      <View className="flex-1 px-6 pb-8 pt-2">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-slate-900">Terms & Conditions</Text>
          <TouchableOpacity onPress={handleDismissTerms} className="rounded-full bg-slate-100 p-2">
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Note: Use BottomSheetScrollView for better gesture handling inside the sheet */}
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-y-6 pb-6">
            <TermSection
              number="1"
              title="Subscription Terms"
              body="By subscribing to MemoPal Premium, you agree to pay the subscription fee for the selected plan. Your subscription will automatically renew unless cancelled at least 24 hours before the end of the current period."
            />
            <TermSection
              number="2"
              title="Free Trial"
              body="New subscribers are eligible for a 7-day free trial. You will not be charged during the trial period. If you don't cancel before the trial ends, your payment method will be charged the subscription fee."
            />
            <TermSection
              number="3"
              title="Cancellation"
              body="You can cancel your subscription at any time from the Settings page. Cancellation takes effect at the end of your current billing period. No refunds will be provided for partial subscription periods."
            />
            <TermSection
              number="4"
              title="Premium Features"
              body="Premium features include unlimited custom palaces, custom images, advanced analytics, cloud sync, and an ad-free experience. Features may be updated or modified at our discretion."
            />
            <TermSection
              number="5"
              title="Data & Privacy"
              body="Your learning data will be stored securely and used only to provide the service. Cloud sync requires Google login and stores your data on secure servers. We will never share your data with third parties."
            />
            <TermSection
              number="6"
              title="Changes to Terms"
              body="We reserve the right to modify these terms at any time. You will be notified of any significant changes. Continued use of the service after changes constitutes acceptance of the new terms."
            />
          </View>
        </BottomSheetScrollView>

        <TouchableOpacity
          onPress={handleDismissTerms}
          className="mt-4 rounded-xl bg-slate-900 py-4">
          <Text className="text-center font-bold text-white">Close</Text>
        </TouchableOpacity>
      </View>
    </CustomBottomSheetModal>
  );
});

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
