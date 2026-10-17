import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useHelpFaqConfig } from '@/features/support/hooks/useHelpFaqConfig';
import { HelpFaqItem } from '@/features/support/types/helpFaqConfig';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Router } from 'expo-router';
import { ChevronRight } from '@/core/icons';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
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
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const styles = createStyles(theme);
  const faqItems = config.faqItems;
  const support = config.support;

  useImperativeHandle(ref, () => bottomSheetRef.current!, []);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <CustomBottomSheetModal ref={bottomSheetRef} snapPoints={['92%']} enableDynamicSizing={false} backgroundStyle={styles.sheetBackground}>
      <View style={styles.header}>
        <View style={styles.headerIcon}><Text style={styles.headerEmoji}>💡</Text></View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{t('helpFaq')}</Text>
          <Text style={styles.subtitle}>{t('helpIntro')}</Text>
        </View>
      </View>
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t('faqLabel')}</Text>
        {/* FAQ Section */}
        {faqItems.map((item, index) => (
          <AccordionItem
            key={index}
            item={item}
            index={index + 1}
            isExpanded={expandedIndex === index}
            onPress={() => toggleItem(index)}
          />
        ))}

        {/* Contact options */}
        <Text style={styles.sectionTitle}>{t('stillNeedHelp')}</Text>

        {support.showEmailSupport ? (
          <AnimatedPressable
            onPress={() => {
              bottomSheetRef.current?.dismiss();
              router.push('/support');
            }}
            style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactEmoji}>✉️</Text>
            </View>
            <View style={styles.contactCopy}>
              <Text style={styles.contactTitle}>{support.emailButtonTitle}</Text>
              <Text style={styles.contactSubtitle}>{support.emailSubtitle || support.email}</Text>
            </View>
            <ChevronRight size={20} color={theme.inkSoft} />
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
  index,
  isExpanded,
  onPress,
}: {
  item: HelpFaqItem;
  index: number;
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

  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const styles = createStyles(theme);
  return (
    <View style={styles.accordion}>
      <AnimatedPressable
        onPress={onPress}
        style={styles.questionButton}>
        <View style={styles.questionIcon}><Text style={styles.questionNumber}>{index}</Text></View>
        <Text style={styles.question}>{item.question}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronRight size={20} color={theme.inkSoft} />
        </Animated.View>
      </AnimatedPressable>

      <Animated.View style={contentStyle}>
        {/* We use a wrapper view to ensure padding doesn't mess up height calculations */}
        <View style={styles.answerWrap}>
          <View style={styles.answerRule} />
          <Text style={styles.answer}>{item.answer}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: typeof memopalThemes.light) => StyleSheet.create({
  sheetBackground: { backgroundColor: theme.paper, borderRadius: 30 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  headerIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 18, borderWidth: 1.5, height: 52, justifyContent: 'center', width: 52 },
  headerEmoji: { fontSize: 27 },
  headerCopy: { flex: 1 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 22 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, marginTop: 3 },
  content: { paddingBottom: 24, paddingHorizontal: 20, paddingTop: 18 },
  sectionLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1, marginBottom: 9, textTransform: 'uppercase' },
  accordion: { marginBottom: 9, overflow: 'hidden' },
  questionButton: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingHorizontal: 12, paddingVertical: 11 },
  questionIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 12, height: 34, justifyContent: 'center', width: 34 },
  questionNumber: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 13 },
  question: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 13, paddingRight: 12 },
  answerWrap: { backgroundColor: theme.violetTint, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginHorizontal: 8, paddingHorizontal: 14, paddingVertical: 12 },
  answerRule: { backgroundColor: theme.violetLine, height: 2, marginBottom: 9, width: 24 },
  answer: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 19 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19, marginBottom: 11, marginTop: 17 },
  contactCard: { alignItems: 'center', backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 15 },
  contactIcon: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  contactEmoji: { fontSize: 21 },
  contactCopy: { flex: 1 },
  contactTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  contactSubtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, marginTop: 3 },
});

export default HelpSheet;
