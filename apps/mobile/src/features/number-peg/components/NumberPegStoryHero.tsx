import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { RefreshCw } from '@/core/icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={t('makeMemory')}
        onPress={onStart}
        style={styles.start}>
        <Text style={styles.startText}>{t('makeMemory')}</Text>
        <Text style={styles.startArrow}>→</Text>
      </AnimatedPressable>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 23, borderWidth: 1.5, gap: 11, overflow: 'hidden', padding: 14 },
  glow: { backgroundColor: theme.paper, borderRadius: 70, height: 140, opacity: 0.42, position: 'absolute', right: -45, top: -75, width: 140 },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  headingCopy: { flex: 1, gap: 2 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 15 },
  sparkle: { color: theme.violetDeep, fontSize: 23, marginRight: 3 },
  example: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 17, borderWidth: 1, gap: 5, paddingHorizontal: 11, paddingVertical: 9 },
  exampleTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  pair: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 12, flexDirection: 'row', gap: 4, minHeight: 38, paddingHorizontal: 8 },
  number: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 16 },
  pegImage: { fontSize: 22 },
  plus: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  word: { color: theme.ink, flex: 1, fontFamily: typography.displayExtraBold, fontSize: 14 },
  swapButton: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 11, flexDirection: 'row', gap: 4, minHeight: 36, paddingHorizontal: 8 },
  swapText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  story: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16 },
  steps: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  stepItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  stepLine: { backgroundColor: theme.violetLine, height: 1.5, marginRight: 5, width: 16 },
  stepDot: { backgroundColor: theme.violetDeep, borderRadius: 4, height: 7, width: 7 },
  stepText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 9.5 },
  start: { alignItems: 'center', backgroundColor: theme.sun, borderBottomColor: theme.sunDeep, borderBottomWidth: 3, borderRadius: 14, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 46, paddingHorizontal: 14 },
  startText: { color: theme.onSun, fontFamily: typography.displayExtraBold, fontSize: 13 },
  startArrow: { color: theme.onSun, fontFamily: typography.displayExtraBold, fontSize: 17 },
}));
