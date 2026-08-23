import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { Colors } from '@/constants/colors';
import { useHelpFaqConfig } from '@/features/support/hooks/useHelpFaqConfig';
import { HelpFaqItem } from '@/features/support/types/helpFaqConfig';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Router } from 'expo-router';
import { Book, ChevronRight, Mail } from 'lucide-react-native';
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
  const faqItems = config.faqItems;
  const support = config.support;

  useImperativeHandle(ref, () => bottomSheetRef.current!, []);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <CustomBottomSheetModal ref={bottomSheetRef} snapPoints={['95%']} enableDynamicSizing={false}>
      <Text className="px-6 pb-4 pt-3 text-xl font-bold">Help & FAQ</Text>
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

        {/* Contact / Tutorial Options */}
        <Text className="mb-3 mt-4 text-lg font-bold text-slate-900">Still need help?</Text>

        <AnimatedPressable
          onPress={() => {
            bottomSheetRef.current?.dismiss();
            router.push('/tutorial');
          }}
          className="mb-3 flex-row items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
          <View className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
            <Book className="h-5 w-5" color={Colors.teal600} />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-slate-900">View Tutorial</Text>
            <Text className="text-sm text-slate-600">Learn the basics</Text>
          </View>
          <ChevronRight className="h-5 w-5" color={Colors.slate400} />
        </AnimatedPressable>

        {/* <AnimatedPressable
          onPress={() => {
            bottomSheetRef.current?.dismiss();
            router.push('/chat');
          }}
          className="mb-3 flex-row items-center gap-3 rounded-xl bg-gray-50 p-4">
          <View className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <MessageCircle className="h-5 w-5 " color={Colors.purple600} />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-slate-900">Live Chat</Text>
            <Text className="text-sm text-slate-600">Get instant help</Text>
          </View>
          <ChevronRight className="h-5 w-5" color={Colors.slate400} />
        </AnimatedPressable> */}

        {support.showEmailSupport ? (
          <AnimatedPressable
            onPress={() => {
              bottomSheetRef.current?.dismiss();
              router.push('/support');
            }}
            className="mb-6 flex-row items-center gap-3 rounded-xl bg-gray-50 p-4">
            <View className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-5 w-5" color={Colors.blue600} />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-slate-900">{support.emailButtonTitle}</Text>
              <Text className="text-sm text-slate-600">{support.emailSubtitle || support.email}</Text>
            </View>
            <ChevronRight className="h-5 w-5" color={Colors.slate400} />
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
        className="mb-1 flex-row justify-between rounded-xl bg-gray-50 p-4 active:bg-gray-100">
        <Text className="flex-1 pr-4 font-semibold text-slate-900">{item.question}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronRight className="h-5 w-5" color={Colors.slate400} />
        </Animated.View>
      </AnimatedPressable>

      <Animated.View style={contentStyle}>
        {/* We use a wrapper view to ensure padding doesn't mess up height calculations */}
        <View className="px-4 pb-4">
          <Text className="text-sm leading-5 text-slate-600">{item.answer}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default HelpSheet;
