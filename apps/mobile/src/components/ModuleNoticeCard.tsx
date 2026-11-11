import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { AppButton } from '@/components/ui/AppButton';
import { useColorScheme } from 'nativewind';
import { memopalThemes, type MemoPalTheme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { RefreshCcw } from '@/core/icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

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
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const styles = createStyles(theme);
  return (
    <View style={styles.card}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onAction ? (
        <AppButton
          label={actionLabel}
          size="compact"
          leadingContent={actionIcon ?? <RefreshCcw size={16} color={theme.onAccent} />}
          onPress={onAction}
          style={styles.retryButton}
        />
      ) : null}
    </View>
  );
}

const createStyles = (theme: MemoPalTheme) => StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.paper,
    borderColor: theme.line,
    borderRadius: appRadii.hero,
    borderWidth: 1,
    padding: appSpacing.xxl,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.mintTint,
    borderRadius: appRadii.control,
    height: 56,
    justifyContent: 'center',
    marginBottom: 9,
    width: 56,
  },
  emoji: { fontSize: appArtworkSizes.medium, marginBottom: 9 },
  title: { color: theme.ink, fontFamily: typography.display, fontSize: appTextStyles.sectionTitle.fontSize, textAlign: 'center' },
  body: { color: theme.inkSoft, fontFamily: typography.body, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, marginTop: 5, textAlign: 'center' },
  retryButton: {
    marginTop: 14,
  },
});
