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
      <View style={styles.decorGlow} />
      <View style={styles.decorOrbit} />
      <Text style={styles.eyebrow}>{t('storyHeroEyebrow')}</Text>
      <Text style={styles.title}>{t('memoryMovies')}</Text>
      <Text numberOfLines={2} style={styles.body}>{t('heroBody')}</Text>
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
        <Text numberOfLines={2} style={styles.story}>{t('storyExample')}</Text>
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
      backgroundColor: theme.berryTint,
      borderWidth: 1.5,
      borderColor: theme.berryLine,
      borderRadius: 28,
      overflow: 'hidden',
      padding: 17,
    },
    decorGlow: { position: 'absolute', width: 160, height: 160, borderRadius: 80, right: -72, top: -76, backgroundColor: theme.berryLine, opacity: 0.38 },
    decorOrbit: { position: 'absolute', width: 138, height: 138, borderRadius: 69, right: -58, top: -64, borderWidth: 1.5, borderColor: theme.berryLine, opacity: 0.8 },
    eyebrow: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
    title: {
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 25,
      lineHeight: 32,
      marginTop: 9,
    },
    body: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 7,
    },
    example: { backgroundColor: theme.paper, borderRadius: 18, borderWidth: 1.5, borderColor: theme.line, padding: 14, marginTop: 15, shadowColor: theme.ink, shadowOpacity: 0.06, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
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
      alignSelf: 'flex-start',
      color: theme.violetDeep,
      backgroundColor: theme.violetTint,
      borderRadius: 999,
      fontFamily: typography.bodyBold,
      fontSize: 11,
      marginTop: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    story: {
      color: theme.ink,
      fontFamily: typography.bodySemibold,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 4,
    },
    steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 11 },
    step: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, backgroundColor: theme.paper, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
    start: {
      backgroundColor: theme.sun,
      borderRadius: 15,
      minHeight: 52,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
      marginTop: 13,
    },
    startText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  })
);
