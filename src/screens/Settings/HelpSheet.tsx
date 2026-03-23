import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { Colors } from '@/constants/colors';
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

const faqItems = [
  {
    question: 'What is the Memory Palace technique?',
    answer:
      'The Memory Palace (or Method of Loci) is an ancient technique where you visualize a familiar place and associate items you want to remember with specific locations in that place.',
  },
  {
    question: 'How does spaced repetition work?',
    answer:
      'Spaced repetition schedules reviews at optimal intervals (24h, 3d, 7d, 30d) to combat the forgetting curve and move information into long-term memory.',
  },
  {
    question: 'How many palaces can I create?',
    answer:
      'Creation limits are based on your current plan. Palace, lesson, location, and word limits are configured from the server and may differ between free and premium plans.',
  },
  {
    question: 'What happens if I miss a review?',
    answer:
      "You'll still earn XP for completing late reviews, but you'll earn 50% less than completing them on time. Your streak won't be affected.",
  },
  {
    question: 'How do I earn badges and XP?',
    answer:
      'Complete lessons, maintain streaks, finish reviews on time, and master palaces to earn XP and unlock badges.',
  },
];

const HelpSheet = forwardRef<Ref, HelpSheetProps>(({ router }, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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
            <Text className="font-medium text-slate-900">Email Support</Text>
            <Text className="text-sm text-slate-600">support@mindpal.app</Text>
          </View>
          <ChevronRight className="h-5 w-5" color={Colors.slate400} />
        </AnimatedPressable>
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
  item: (typeof faqItems)[0];
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
