import { useTranslation } from '@/core/i18n/useTranslation';
import { LevelUpModal } from '@/components/LevelUpModal';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { Check, Home, RefreshCcw } from '@/core/icons';
import { AppButton } from '@/components/ui/AppButton';
import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type RecallResultCardProps = {
  tone: 'peg' | 'palace';
  title: string;
  recalledFirstTry: number;
  total: number;
  body: string;
  recalledLabel: string;
  needsPracticeLabel: string;
  xpEarned?: number;
  levelUpTo?: number;
  saveStatus?: ReactNode;
  onRetry: () => void;
  retryLabel?: string;
  retryAccessibilityLabel?: string;
  secondaryAction?: { label: string; onPress: () => void };
  returnHomeLabel: string;
  onReturnHome: () => void;
};

/** Shared completion surface for both memory technique players. */
export function RecallResultCard({
  tone,
  title,
  recalledFirstTry,
  total,
  body,
  recalledLabel,
  needsPracticeLabel,
  xpEarned = 0,
  levelUpTo,
  saveStatus,
  onRetry,
  retryLabel = 'Try another round',
  retryAccessibilityLabel = 'Try another recall round',
  secondaryAction,
  returnHomeLabel,
  onReturnHome,
}: RecallResultCardProps) {
  const { styles } = useStyles();
  const { t } = useTranslation('achievements');
  const isPeg = tone === 'peg';
  const [levelUpVisible, setLevelUpVisible] = React.useState(Boolean(levelUpTo));

  React.useEffect(() => {
    if (levelUpTo) setLevelUpVisible(true);
  }, [levelUpTo]);

  return (
    <View style={[styles.card, !isPeg && styles.palaceCard]} accessibilityRole="summary">
      {levelUpTo ? <LevelUpModal level={levelUpTo} visible={levelUpVisible} onClose={() => setLevelUpVisible(false)} /> : null}
      {isPeg ? <Text style={styles.emoji}>🏆</Text> : (
        <View style={styles.palaceHero}>
          <View style={styles.palaceCheck}><Check size={24} color={theme.successText} strokeWidth={3} /></View>
        </View>
      )}
      <Text style={[styles.title, !isPeg && styles.palaceTitle]}>{title}</Text>
      {!isPeg ? <Text style={[styles.body, styles.palaceBody]}>{body}</Text> : null}
      <View style={[styles.resultRow, !isPeg && styles.palaceResultRow]}>
        <View style={[styles.resultStat, !isPeg && styles.palaceRecallStat]}>
          <Text style={styles.recalledValue}>{recalledFirstTry}</Text>
          <Text style={[styles.resultLabel, !isPeg && styles.palaceResultLabel]}>{recalledLabel}</Text>
        </View>
        <View style={[styles.resultDivider, !isPeg && styles.palaceResultDivider]} />
        <View style={[styles.resultStat, !isPeg && styles.palacePracticeStat]}>
          <Text style={styles.practiceValue}>{Math.max(0, total - recalledFirstTry)}</Text>
          <Text style={[styles.resultLabel, !isPeg && styles.palaceResultLabel]}>{needsPracticeLabel}</Text>
        </View>
      </View>
      {isPeg ? <Text style={styles.body}>{body}</Text> : null}
      {xpEarned > 0 ? (
        <View style={[styles.xpPill, !isPeg && styles.palaceXpPill]} accessibilityLiveRegion="polite">
          <Text style={styles.xpText}>+{xpEarned} XP</Text>
          {levelUpTo ? <Text style={styles.levelText}>{t('level').toUpperCase()} {levelUpTo}</Text> : null}
        </View>
      ) : null}
      {saveStatus}
      <View style={styles.actionWrap}>
        <AppButton
          label={retryLabel}
          accessibilityLabel={retryAccessibilityLabel}
          variant="primary"
          size="large"
          fullWidth
          icon={RefreshCcw}
          onPress={onRetry}
        />
      </View>
      {secondaryAction ? (
        <View style={[styles.actionWrap, styles.secondaryActionWrap]}>
          <AppButton
            label={secondaryAction.label}
            variant="secondary"
            size="large"
            fullWidth
            onPress={secondaryAction.onPress}
          />
        </View>
      ) : null}
      <AppButton
        label={returnHomeLabel}
        variant="tertiary"
        size="compact"
        icon={Home}
        onPress={onReturnHome}
      />
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { flex: 1, minHeight: 390, borderRadius: 25, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 24, alignItems: 'center', justifyContent: 'center' },
  palaceCard: { minHeight: 360, borderColor: theme.violetLine, borderRadius: 23, paddingHorizontal: 20, paddingVertical: 24, justifyContent: 'flex-start' },
  palaceHero: { alignItems: 'center', marginBottom: 4 },
  palaceCheck: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.mintTint, marginBottom: 12 },
  emoji: { fontSize: 54 },
  title: { color: theme.ink, fontFamily: typography.display, fontSize: 22, marginTop: 12, textAlign: 'center' },
  palaceTitle: { fontSize: 25, marginTop: 6 },
  palaceBody: { marginTop: 8, marginBottom: 4, maxWidth: 290 },
  resultRow: { width: '100%', flexDirection: 'row', alignItems: 'stretch', marginTop: 18, borderRadius: 18, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingVertical: 13 },
  palaceResultRow: { marginTop: 18, borderWidth: 0, borderRadius: 18, backgroundColor: theme.violetTint, padding: 14, minHeight: 96 },
  resultStat: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  palaceRecallStat: { borderRadius: 12 },
  palacePracticeStat: { borderRadius: 12 },
  resultDivider: { width: 2, backgroundColor: theme.line },
  palaceResultDivider: { width: 1, backgroundColor: theme.violetLine },
  recalledValue: { color: theme.successText, fontFamily: typography.displayExtraBold, fontSize: 28 },
  practiceValue: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 28 },
  resultLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10.5, marginTop: 2, textAlign: 'center' },
  palaceResultLabel: { maxWidth: 120, lineHeight: 15, fontSize: 11 },
  body: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 14, marginBottom: 12 },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, backgroundColor: theme.sunTint, borderWidth: 2, borderColor: theme.sunLine, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 14 },
  palaceXpPill: { marginTop: 14, marginBottom: 12, borderWidth: 0, backgroundColor: theme.mintTint },
  xpText: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 15 },
  levelText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  actionWrap: { alignSelf: 'stretch' },
  secondaryActionWrap: { marginTop: 12 },
}));
