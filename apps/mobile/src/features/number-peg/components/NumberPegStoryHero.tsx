import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ArrowRight, RefreshCw } from '@/core/icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const EXAMPLES = [
  { number: '1', image: '🕯️', word: 'exampleWordPassport', story: 'exampleStoryPassport' },
  { number: '2', image: '🦢', word: 'exampleWordUmbrella', story: 'exampleStoryUmbrella' },
  { number: '3', image: '❤️', word: 'exampleWordCoffee', story: 'exampleStoryCoffee' },
] as const;

export function NumberPegStoryHero({ onStart }: { onStart: () => void }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('numberPeg');
  const [exampleIndex, setExampleIndex] = useState(0);
  const example = EXAMPLES[exampleIndex];
  return (
    <View style={styles.card}>
      <View style={styles.glow} />
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{t('memoryMovies')}</Text>
          <Text style={styles.body}>{t('heroBody')}</Text>
        </View>
        <Text style={styles.sparkle}>✦</Text>
      </View>

      <View style={styles.example}>
        <View style={styles.exampleTop}>
          <View style={styles.pair}>
            <Text style={styles.number}>{example.number}</Text>
            <Text style={styles.pegImage}>{example.image}</Text>
          </View>
          <Text style={styles.plus}>+</Text>
          <Text numberOfLines={1} style={styles.word}>{t(example.word)}</Text>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t('swapStoryExample')}
            onPress={() => setExampleIndex((current) => (current + 1) % EXAMPLES.length)}
            style={styles.swapButton}>
            <RefreshCw size={14} color={theme.violetDeep} />
            <Text style={styles.swapText}>{t('swapStoryExample')}</Text>
          </AnimatedPressable>
        </View>
        <Text style={styles.story}>{t(example.story)}</Text>
      </View>

      <View style={styles.steps} accessibilityElementsHidden>
        {[t('storyStepContent'), t('storyStepImagine'), t('storyStepRecall')].map((step, index) => (
          <View key={step} style={styles.stepItem}>
            {index > 0 ? <View style={styles.stepLine} /> : null}
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <AppButton label={t('makeMemory')} onPress={onStart} size="large" trailingIcon={ArrowRight} />
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 23, borderWidth: 1.5, gap: 11, overflow: 'hidden', padding: 14 },
  glow: { backgroundColor: theme.paper, borderRadius: 70, height: 140, opacity: 0.42, position: 'absolute', right: -45, top: -75, width: 140 },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.sm },
  headingCopy: { flex: 1, gap: 2 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  sparkle: { color: theme.violetDeep, fontSize: appTextStyles.stat.fontSize, marginRight: 3 },
  example: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1, gap: 5, paddingHorizontal: 11, paddingVertical: 9 },
  exampleTop: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.sm },
  pair: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.control, flexDirection: 'row', gap: appSpacing.xs, minHeight: 38, paddingHorizontal: appSpacing.sm },
  number: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.cardTitle.fontSize },
  pegImage: { fontSize: appTextStyles.prompt.fontSize },
  plus: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize },
  word: { color: theme.ink, flex: 1, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.label.fontSize },
  swapButton: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 11, flexDirection: 'row', gap: appSpacing.xs, minHeight: 44, paddingHorizontal: appSpacing.sm },
  swapText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  story: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  steps: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  stepItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  stepLine: { backgroundColor: theme.violetLine, height: 1.5, marginRight: 5, width: 16 },
  stepDot: { backgroundColor: theme.violetDeep, borderRadius: 4, height: 7, width: 7 },
  stepText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
}));
