import AnimatedPressable from '@/components/AnimatedPressable';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { RefreshCcw } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ModuleNoticeCardProps = {
  title: string;
  body: string;
  emoji?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => unknown;
};

/** Shared empty/error state for technique shelves and module landing screens. */
export function ModuleNoticeCard({
  title,
  body,
  emoji,
  icon,
  actionLabel = 'Try again',
  actionIcon,
  onAction,
}: ModuleNoticeCardProps) {
  return (
    <View style={styles.card}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onAction ? (
        <AnimatedPressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          onPress={onAction}
          style={styles.retryButton}>
          {actionIcon ?? <RefreshCcw size={16} color={theme.ink} />}
          <Text style={styles.retryText}>{actionLabel}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.paper,
    borderColor: theme.line,
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: '#EEE9FF',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    marginBottom: 9,
    width: 42,
  },
  emoji: { fontSize: 31, marginBottom: 9 },
  title: { color: theme.ink, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  body: { color: theme.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' },
  retryButton: {
    alignItems: 'center',
    backgroundColor: theme.sun,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryText: { color: theme.ink, fontSize: 13, fontWeight: '900' },
});
