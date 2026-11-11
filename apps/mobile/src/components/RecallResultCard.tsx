import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { useTranslation } from '@/core/i18n/useTranslation';
import { CompanionLearningPresence } from '@/features/profile/companion/CompanionLearningPresence';
import { LevelUpModal } from '@/components/LevelUpModal';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, Home, RefreshCcw } from '@/core/icons';
import { AppButton } from '@/components/ui/AppButton';
import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

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
  const { styles, theme } = useStyles();
  const { t } = useTranslation('achievements');
  const isPeg = tone === 'peg';
  const [levelUpVisible, setLevelUpVisible] = React.useState(Boolean(levelUpTo));

  React.useEffect(() => {
    if (levelUpTo) setLevelUpVisible(true);
  }, [levelUpTo]);

  return (
    <View style={[styles.card, !isPeg && styles.palaceCard]} accessibilityRole="summary">
      {levelUpTo ? <LevelUpModal level={levelUpTo} visible={levelUpVisible} onClose={() => setLevelUpVisible(false)} /> : null}
      <View style={styles.heroRow}>
      {isPeg ? <Text style={styles.emoji}>🏆</Text> : (
        <View style={styles.palaceHero}>
          <View style={styles.palaceCheck}><Check size={24} color={theme.successText} strokeWidth={3} /></View>
        </View>
      )}
      <View style={styles.companionSlot}><CompanionLearningPresence state="complete" corner /></View>
      </View>
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
  card: { flex: 1, minHeight: 390, borderRadius: 25, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper, padding: appSpacing.xxl, alignItems: 'center', justifyContent: 'center' },
  heroRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', minHeight: 132 },
  companionSlot: { position: 'relative', width: 116, height: 120 },
  palaceCard: { minHeight: 360, borderColor: theme.violetLine, borderRadius: 23, paddingHorizontal: appSpacing.xl, paddingVertical: appSpacing.xxl, justifyContent: 'flex-start' },
  palaceHero: { alignItems: 'center', marginBottom: appSpacing.xs },
  palaceCheck: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.mintTint, marginBottom: appSpacing.md },
  emoji: { fontSize: appArtworkSizes.hero },
  title: { color: theme.ink, fontFamily: typography.display, fontSize: appTextStyles.prompt.fontSize, marginTop: appSpacing.md, textAlign: 'center' },
  palaceTitle: { fontSize: appTextStyles.pageTitle.fontSize, marginTop: 6 },
  palaceBody: { marginTop: appSpacing.sm, marginBottom: appSpacing.xs, maxWidth: 290 },
  resultRow: { width: '100%', flexDirection: 'row', alignItems: 'stretch', marginTop: 18, borderRadius: appRadii.card, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper, paddingVertical: 13 },
  palaceResultRow: { marginTop: 18, borderWidth: 0, borderRadius: appRadii.card, backgroundColor: theme.paper, padding: 14, minHeight: 96 },
  resultStat: { flex: 1, alignItems: 'center', paddingHorizontal: appSpacing.sm },
  palaceRecallStat: { borderRadius: appRadii.control },
  palacePracticeStat: { borderRadius: appRadii.control },
  resultDivider: { width: 2, backgroundColor: theme.line },
  palaceResultDivider: { width: 1, backgroundColor: theme.violetLine },
  recalledValue: { color: theme.successText, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.pageTitle.fontSize },
  practiceValue: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.pageTitle.fontSize },
  resultLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, marginTop: 2, textAlign: 'center' },
  palaceResultLabel: { maxWidth: 120, lineHeight: appTextStyles.caption.lineHeight, fontSize: appTextStyles.caption.fontSize },
  body: { color: theme.inkSoft, fontFamily: typography.body, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, textAlign: 'center', marginTop: 14, marginBottom: appSpacing.md },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.sm, borderRadius: appRadii.pill, backgroundColor: theme.sunTint, borderWidth: 2, borderColor: theme.sunLine, paddingHorizontal: 14, paddingVertical: appSpacing.sm, marginBottom: 14 },
  palaceXpPill: { marginTop: 14, marginBottom: appSpacing.md, borderWidth: 0, backgroundColor: theme.mintTint },
  xpText: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.body.fontSize },
  levelText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.8 },
  actionWrap: { alignSelf: 'stretch' },
  secondaryActionWrap: { marginTop: appSpacing.md },
}));
