import AnimatedPressable from '@/components/AnimatedPressable';
import { ReturnToTodayButton } from '@/components/ReturnToTodayButton';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { RefreshCcw } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type RecallResultCardProps = {
  tone: 'peg' | 'palace';
  title: string;
  score: number;
  total: number;
  body: string;
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
  score,
  total,
  body,
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

  return (
    <View style={[styles.card, !isPeg && styles.palaceCard]} accessibilityRole="summary">
      <Text style={styles.emoji}>🏆</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.score}>{score} / {total}</Text>
      <Text style={styles.body}>{body}</Text>
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
  score: { color: theme.grass, fontFamily: typography.displayExtraBold, fontSize: 34, marginTop: 8 },
  body: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  actionWrap: { alignSelf: 'stretch' },
  secondaryActionWrap: { marginTop: 12 },
  primaryButton: { width: '100%', minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, boxShadow: `0px 5px 0px ${theme.sunDeep}` },
  primaryText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, textAlign: 'center' },
  secondaryButton: { width: '100%', minHeight: 49, borderRadius: 16, borderWidth: 2, borderColor: '#9B8CFF', backgroundColor: '#F7F5FF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  secondaryText: { color: '#6654D9', fontFamily: typography.bodyExtraBold, fontSize: 14 },
});
