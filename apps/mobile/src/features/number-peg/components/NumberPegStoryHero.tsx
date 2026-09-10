import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { StyleSheet, Text, View } from 'react-native';

export function NumberPegStoryHero({ onStart }: { onStart: () => void }) {
  const { styles } = useStyles();
  const { t } = useTranslation('numberPeg');
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{t('storyHeroEyebrow')}</Text>
      <Text style={styles.title}>{t('memoryMovies')}</Text>
      <Text style={styles.body}>{t('heroBody')}</Text>
      <View style={styles.example}>
        <View style={styles.actorRow}>
          <View style={styles.number}>
            <Text style={styles.numberText}>1</Text>
          </View>
          <Text style={styles.actor}>🕯️</Text>
          <Text style={styles.arrow}>＋</Text>
          <Text style={styles.word}>passport</Text>
        </View>
        <Text style={styles.exampleLabel}>{t('storyExampleLabel')}</Text>
        <Text style={styles.story}>{t('storyExample')}</Text>
      </View>
      <View style={styles.steps}>
        {[t('storyStepContent'), t('storyStepImagine'), t('storyStepRecall')].map((step, i) => (
          <Text key={step} style={styles.step}>
            {i + 1} · {step}
          </Text>
        ))}
      </View>
      <AnimatedPressable
        onPress={onStart}
        accessibilityLabel={t('makeMemory')}
        style={styles.start}>
        <Text style={styles.startText}>{t('makeMemory')}　→</Text>
      </AnimatedPressable>
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.paper,
      borderWidth: 1.5,
      borderColor: theme.line,
      borderRadius: 26,
      padding: 20,
    },
    eyebrow: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
    title: {
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 27,
      lineHeight: 35,
      marginTop: 9,
    },
    body: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 9,
    },
    example: { backgroundColor: theme.violetTint, borderRadius: 19, padding: 15, marginTop: 20 },
    actorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    number: {
      minWidth: 36,
      minHeight: 36,
      borderRadius: 12,
      backgroundColor: theme.paper,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 5,
    },
    numberText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 21 },
    actor: { fontSize: 32 },
    arrow: { color: theme.inkSoft, fontSize: 17 },
    word: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 19 },
    exampleLabel: {
      color: theme.violetDeep,
      fontFamily: typography.bodyBold,
      fontSize: 11,
      marginTop: 12,
    },
    story: {
      color: theme.ink,
      fontFamily: typography.bodySemibold,
      fontSize: 15,
      lineHeight: 24,
      marginTop: 5,
    },
    steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 17 },
    step: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
    start: {
      backgroundColor: theme.sun,
      borderRadius: 15,
      minHeight: 52,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
      marginTop: 17,
    },
    startText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 16 },
  })
);
