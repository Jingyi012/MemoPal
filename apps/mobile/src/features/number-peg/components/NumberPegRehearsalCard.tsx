import { SpotlightTarget } from '@/features/onboarding/components/SpotlightTourProvider';
import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemoryItem, PegBinding } from '@/features/memory-sets';
import { createThemedStyles } from '@/theme/createThemedStyles';
import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';
import { typography } from '@/theme/typography';
import { ArrowLeft, ArrowRight } from '@/core/icons';
import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';
import { localizeNumberPeg } from '@/features/number-peg/utils/localizedNumberPeg';
import { AiGeneratedImage } from '@/features/ai-credits/components/AiGeneratedImage';

type NumberPegRehearsalCardProps = {
  item: MemoryItem;
  peg: NumberPegItem;
  binding?: PegBinding;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  lastActionLabel?: string;
  onRevealScene?: () => void;
  onRevealNext?: () => void;
};

export function NumberPegRehearsalCard({
  item,
  peg,
  binding,
  index,
  total,
  onPrevious,
  onNext,
  lastActionLabel,
  onRevealScene,
  onRevealNext,
}: NumberPegRehearsalCardProps) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('numberPeg');
  const localizedPeg = useMemo(() => localizeNumberPeg(peg, t), [peg, t]);
  const isFirst = index === 0;
  const isLast = index === total - 1;
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.icon}>
          <Text style={styles.iconEmoji}>💡</Text>
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
      </View>
      <Text style={styles.prompt}>{t('promptPause')}</Text>
      <SpotlightTarget id="sessionScene" onReveal={onRevealScene}>
      <Text style={styles.sceneText}>{binding?.sceneText ?? t('sceneInteraction')}</Text>
      </SpotlightTarget>
      {binding?.sceneAssetUrl?.startsWith('/v1/ai-credits/images/') && <AiGeneratedImage path={binding.sceneAssetUrl} description={binding.sceneText} />}
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
          <SpotlightTarget id="sessionRecall" onReveal={onRevealNext} onActivate={onNext}>
          <AnimatedPressable onPress={onNext} style={styles.nextButton}>
            <Text style={styles.nextText}>{isLast ? lastActionLabel ?? t('startRecall') : t('next')}</Text>
            <ArrowRight size={17} color={theme.onSun} />
          </AnimatedPressable>
          </SpotlightTarget>
        </View>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
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
      fontSize: 16,
      lineHeight: 25,
      marginTop: 8,
      textAlign: 'center',
    },
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
    nextText: {
      color: theme.onSun,
      flexShrink: 1,
      textAlign: 'center',
      fontFamily: typography.bodyExtraBold,
      fontSize: 12,
    },
  })
);
