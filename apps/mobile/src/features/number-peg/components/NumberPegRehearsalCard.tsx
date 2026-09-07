import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemoryItem, PegBinding } from '@/features/memory-sets';
import { createThemedStyles } from '@/theme/createThemedStyles';
import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';
import { typography } from '@/theme/typography';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, InteractionManager, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSoundEffects } from '@/core/audio/useSoundEffects';
import { useTranslation } from '@/core/i18n/useTranslation';
import { localizeNumberPeg } from '@/features/number-peg/utils/localizedNumberPeg';
import { NumberPegMovieStage } from '@/features/number-peg/components/NumberPegMovieStage';

type NumberPegRehearsalCardProps = {
  item: MemoryItem;
  peg: NumberPegItem;
  binding?: PegBinding;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function NumberPegRehearsalCard({
  item,
  peg,
  binding,
  index,
  total,
  onPrevious,
  onNext,
}: NumberPegRehearsalCardProps) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('numberPeg');
  const localizedPeg = useMemo(() => localizeNumberPeg(peg, t), [peg, t]);
  const { playSound, feedbackEnabled } = useSoundEffects();
  const [playSignal, setPlaySignal] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const recipe = useMemo(
    () => binding?.sceneRecipe ?? fallbackRecipe(item.answer, localizedPeg),
    [binding?.sceneRecipe, item.answer, localizedPeg]
  );
  const soundPreset = recipe.soundPreset ?? 'complete';
  const hapticPreset = recipe.hapticPreset;
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReducedMotion)
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );
    return () => subscription.remove();
  }, []);
  const playScene = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setPlaySignal((signal) => signal + 1);
    feedbackTimerRef.current = setTimeout(() => {
      feedbackTimerRef.current = null;
      playSound(soundPreset);
      if (feedbackEnabled && hapticPreset)
        void Haptics.impactAsync(
          hapticPreset === 'success'
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Medium
        ).catch(() => undefined);
    }, reducedMotion ? 0 : 520);
  }, [feedbackEnabled, hapticPreset, playSound, reducedMotion, soundPreset]);
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      autoPlayTimerRef.current = setTimeout(() => {
        autoPlayTimerRef.current = null;
        playScene();
      }, 100);
    });
    return () => {
      interaction.cancel();
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, [index, playScene, recipe.actionPreset, recipe.sensoryBoosters]);
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.icon}>
          <Text style={styles.iconEmoji}>🎬</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            {t('pegLabel').toUpperCase()} {localizedPeg.number} ·{' '}
            {localizedPeg.keyword.toUpperCase()}
          </Text>
          <Text style={styles.progress}>
            {index + 1} {t('of')} {total}
          </Text>
        </View>
        <AnimatedPressable
          accessibilityLabel={t('replayScene')}
          onPress={playScene}
          style={styles.replayButton}>
          <RotateCcw size={17} color={theme.berryDeep} />
        </AnimatedPressable>
      </View>
      <NumberPegMovieStage
        compact
        pegNumber={localizedPeg.number}
        pegImage={localizedPeg.image}
        pegKeyword={localizedPeg.keyword}
        targetLabel={item.answer}
        recipe={recipe}
        playSignal={playSignal}
        reducedMotion={reducedMotion}
      />
      <Text style={styles.prompt}>{t('promptPause')}</Text>
      <Text style={styles.sceneText}>
        {binding?.sceneText ?? `${t('sceneInteraction')} (${item.answer})`}
      </Text>
      {binding?.sceneRecipe?.sensoryBoosters?.[0] ? (
        <Text style={styles.booster}>
          {t(`booster_${binding.sceneRecipe.sensoryBoosters[0]}` as any)}
        </Text>
      ) : null}
      <View style={styles.wordTag}>
        <Text style={styles.wordTagText}>{item.answer}</Text>
      </View>
      <View style={styles.actions}>
        <AnimatedPressable
          accessibilityLabel={t('previousPeg')}
          disabled={isFirst}
          onPress={onPrevious}
          style={[styles.roundButton, isFirst && styles.disabled]}>
          <ArrowLeft size={19} color={theme.onSun} />
        </AnimatedPressable>
        <View style={styles.nextButtonWrap}>
          <AnimatedPressable onPress={onNext} style={styles.nextButton}>
            <Text style={styles.nextText}>{isLast ? t('startRecall') : t('next')}</Text>
            <ArrowRight size={17} color={theme.onSun} />
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

function fallbackRecipe(item: string, peg: NumberPegItem) {
  return {
    schemaVersion: 1 as const,
    associationSource: 'suggested' as const,
    caption: `${peg.keyword} ${item}`,
    actionPreset: 'bounce' as const,
    visualEffectPreset: 'bounce',
    soundPreset: 'complete' as const,
    hapticPreset: 'impact' as const,
    sensoryBoosters: [],
    targetVisual: { kind: 'word' as const, value: item },
  };
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.paper,
    borderColor: theme.line,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    boxShadow: '0px 7px 0px rgba(43,42,61,0.08)',
  },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.berryTint,
    borderRadius: 13,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  iconEmoji: { fontSize: 20 },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: theme.berryDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  progress: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3 },
  sceneVisual: {
    alignItems: 'center',
    backgroundColor: theme.sunTint,
    borderColor: theme.sunLine,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 114,
    padding: 12,
  },
  pegBubble: {
    alignItems: 'center',
    backgroundColor: theme.berryTint,
    borderColor: theme.berryLine,
    borderRadius: 40,
    borderWidth: 2,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  pegEmoji: { fontSize: 32 },
  pegNumber: {
    color: theme.berryDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    marginTop: 2,
  },
  answer: {
    color: theme.ink,
    flexShrink: 1,
    fontFamily: typography.display,
    fontSize: 18,
    maxWidth: 145,
    textAlign: 'center',
  },
  prompt: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  sceneText: {
    color: theme.ink,
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  booster: {
    alignSelf: 'center',
    color: theme.berryDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 11,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  replayButton: {
    alignItems: 'center',
    backgroundColor: theme.violetTint,
    borderRadius: 18,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sceneSparkle: { fontSize: 20 },
  wordTag: {
    alignSelf: 'center',
    backgroundColor: theme.mintTint,
    borderColor: theme.mintLine,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  wordTagText: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 18, width: '100%' },
  roundButton: {
    alignItems: 'center',
    backgroundColor: theme.sun,
    borderRadius: 23,
    minHeight: 46,
    justifyContent: 'center',
    width: 46,
  },
  disabled: { opacity: 0.3 },
  nextButtonWrap: { flex: 1, minWidth: 0 },
  nextButton: {
    alignItems: 'center',
    backgroundColor: theme.sun,
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  nextText: { color: theme.onSun, flexShrink: 1, textAlign: 'center', fontFamily: typography.bodyExtraBold, fontSize: 12 },
}));
