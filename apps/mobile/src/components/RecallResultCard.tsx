import AnimatedPressable from '@/components/AnimatedPressable';
import { ReturnToTodayButton } from '@/components/ReturnToTodayButton';
import { LevelUpModal } from '@/components/LevelUpModal';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { RefreshCcw } from 'lucide-react-native';
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
  returnToTodayLabel?: string;
  returnToTodayAccessibilityLabel?: string;
  onReturnToToday: () => void;
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
  returnToTodayLabel,
  returnToTodayAccessibilityLabel,
  onReturnToToday,
}: RecallResultCardProps) {
  const isPeg = tone === 'peg';
  const [levelUpVisible, setLevelUpVisible] = React.useState(Boolean(levelUpTo));

  React.useEffect(() => {
    if (levelUpTo) setLevelUpVisible(true);
  }, [levelUpTo]);

  return (
    <View style={[styles.card, !isPeg && styles.palaceCard]} accessibilityRole="summary">
      {levelUpTo ? <LevelUpModal level={levelUpTo} visible={levelUpVisible} onClose={() => setLevelUpVisible(false)} /> : null}
      <Text style={styles.emoji}>🏆</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.resultRow}>
        <View style={styles.resultStat}>
          <Text style={styles.recalledValue}>{recalledFirstTry}</Text>
          <Text style={styles.resultLabel}>{recalledLabel}</Text>
        </View>
        <View style={styles.resultDivider} />
        <View style={styles.resultStat}>
          <Text style={styles.practiceValue}>{Math.max(0, total - recalledFirstTry)}</Text>
          <Text style={styles.resultLabel}>{needsPracticeLabel}</Text>
        </View>
      </View>
      <Text style={styles.body}>{body}</Text>
      {xpEarned > 0 ? (
        <View style={styles.xpPill} accessibilityLiveRegion="polite">
          <Text style={styles.xpText}>+{xpEarned} XP</Text>
          {levelUpTo ? <Text style={styles.levelText}>LEVEL {levelUpTo}</Text> : null}
        </View>
      ) : null}
      {saveStatus}
      <View style={styles.actionWrap}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={retryAccessibilityLabel}
          onPress={onRetry}
          style={styles.primaryButton}>
          <RefreshCcw size={18} color={theme.ink} />
          <Text style={styles.primaryText}>{retryLabel}</Text>
        </AnimatedPressable>
      </View>
      {secondaryAction ? (
        <View style={[styles.actionWrap, styles.secondaryActionWrap]}>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={secondaryAction.label}
            onPress={secondaryAction.onPress}
            style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>{secondaryAction.label}</Text>
          </AnimatedPressable>
        </View>
      ) : null}
      <ReturnToTodayButton
        onPress={onReturnToToday}
        label={returnToTodayLabel}
        accessibilityLabel={returnToTodayAccessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 390, borderRadius: 25, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 24, alignItems: 'center', justifyContent: 'center' },
  palaceCard: { minHeight: 360, borderColor: '#DCD4FF', borderRadius: 23 },
  emoji: { fontSize: 54 },
  title: { color: theme.ink, fontFamily: typography.display, fontSize: 22, marginTop: 12, textAlign: 'center' },
  resultRow: { width: '100%', flexDirection: 'row', alignItems: 'stretch', marginTop: 18, borderRadius: 18, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', paddingVertical: 13 },
  resultStat: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  resultDivider: { width: 2, backgroundColor: theme.line },
  recalledValue: { color: theme.grass, fontFamily: typography.displayExtraBold, fontSize: 28 },
  practiceValue: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 28 },
  resultLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10.5, marginTop: 2, textAlign: 'center' },
  body: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 14, marginBottom: 12 },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, backgroundColor: '#FFF3D6', borderWidth: 2, borderColor: '#FFE3AE', paddingHorizontal: 14, paddingVertical: 8, marginBottom: 14 },
  xpText: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 15 },
  levelText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  actionWrap: { alignSelf: 'stretch' },
  secondaryActionWrap: { marginTop: 12 },
  primaryButton: { width: '100%', minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, boxShadow: `0px 5px 0px ${theme.sunDeep}` },
  primaryText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, textAlign: 'center' },
  secondaryButton: { width: '100%', minHeight: 49, borderRadius: 16, borderWidth: 2, borderColor: '#9B8CFF', backgroundColor: '#F7F5FF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  secondaryText: { color: '#6654D9', fontFamily: typography.bodyExtraBold, fontSize: 14 },
});
