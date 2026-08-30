import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useHelpFaqConfig } from '@/features/support/hooks/useHelpFaqConfig';
import { HelpFaqItem } from '@/features/support/types/helpFaqConfig';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

// --- Main HelpSheet Component ---
type Ref = BottomSheetModal;

interface HelpSheetProps {
  router: Router;
}

const HelpSheet = forwardRef<Ref, HelpSheetProps>(({ router }, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { config } = useHelpFaqConfig();
  const { t } = useTranslation('support');
  const faqItems = config.faqItems;
  const support = config.support;

  useImperativeHandle(ref, () => bottomSheetRef.current!, []);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <CustomBottomSheetModal ref={bottomSheetRef} snapPoints={['95%']} enableDynamicSizing={false}>
      <Text className="px-6 pb-4 pt-3 text-xl font-bold">{t('helpFaq')}</Text>
      <BottomSheetScrollView className="px-6 py-4">
        {/* FAQ Section */}
        {faqItems.map((item, index) => (
          <AccordionItem
            key={index}
            item={item}
            isExpanded={expandedIndex === index}
            onPress={() => toggleItem(index)}
          />
        ))}

        {/* Contact options */}
        <Text className="mb-3 mt-4 text-lg font-bold text-[#2B2A3D]">{t('stillNeedHelp')}</Text>

        {support.showEmailSupport ? (
          <AnimatedPressable
            onPress={() => {
              bottomSheetRef.current?.dismiss();
              router.push('/support');
            }}
            className="mb-6 flex-row items-center gap-3 rounded-2xl border-2 border-[#DCD4FF] bg-[#EEE9FF] p-4">
            <View className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCD4FF]">
              <Text className="text-xl">✉️</Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-[#2B2A3D]">{support.emailButtonTitle}</Text>
              <Text className="text-sm text-[#6B6A80]">{support.emailSubtitle || support.email}</Text>
            </View>
            <ChevronRight className="h-5 w-5" color={theme.inkSoft} />
          </AnimatedPressable>
        ) : null}
      </BottomSheetScrollView>
    </CustomBottomSheetModal>
  );
});
HelpSheet.displayName = 'HelpSheet';

// --- Sub-component: AccordionItem ---
const AccordionItem = ({
  item,
  isExpanded,
  onPress,
}: {
  item: HelpFaqItem;
  isExpanded: boolean;
  onPress: () => void;
}) => {
  // Create a transition value (0 to 1)
  const progress = useDerivedValue(() => withTiming(isExpanded ? 1 : 0, { duration: 100 }));

  // Chevron rotation animation
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 90}deg` }],
  }));

  // Height and Opacity animation
  const contentStyle = useAnimatedStyle(() => {
    return {
      height: isExpanded ? 'auto' : 0, // Fallback for simple usage
      opacity: 1,
      overflow: 'hidden',
    };
  });

  return (
    <View className="mb-2 overflow-hidden">
      <AnimatedPressable
        onPress={onPress}
        className="mb-1 flex-row justify-between rounded-2xl border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4 active:bg-[#F6F3EA]">
        <Text className="flex-1 pr-4 font-semibold text-[#2B2A3D]">{item.question}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronRight className="h-5 w-5" color={theme.inkSoft} />
        </Animated.View>
      </AnimatedPressable>

      <Animated.View style={contentStyle}>
        {/* We use a wrapper view to ensure padding doesn't mess up height calculations */}
        <View className="px-4 pb-4">
          <Text className="text-sm leading-5 text-[#6B6A80]">{item.answer}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default HelpSheet;
