import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { Globe2, Link2, LockKeyhole } from '@/core/icons';
import { useColorScheme } from 'nativewind';
import { StyleSheet, View } from 'react-native';
import type { MemorySetVisibility } from '@/features/memory-sets';
import { memopalThemes, type MemoPalTheme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';

type MemoryVisibilityBadgeProps = {
  visibility: MemorySetVisibility;
  label: string;
  compact?: boolean;
};

export function MemoryVisibilityBadge({ visibility, label, compact = false }: MemoryVisibilityBadgeProps) {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const styles = createStyles(theme);
  const Icon = visibility === 'public' ? Globe2 : visibility === 'unlisted' ? Link2 : LockKeyhole;
  const color = visibility === 'public' ? theme.successText : visibility === 'unlisted' ? theme.link : theme.violetDeep;
  const backgroundColor = visibility === 'public' ? theme.mintTint : visibility === 'unlisted' ? theme.skyTint : theme.violetTint;

  return (
    <View style={[styles.badge, compact && styles.badgeCompact, { backgroundColor }]}>
      <Icon size={compact ? 11 : 12} color={color} />
      <Text numberOfLines={1} style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: MemoPalTheme) => StyleSheet.create({
  badge: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: appRadii.pill, flexDirection: 'row', gap: 5, maxWidth: '100%', paddingHorizontal: 9, paddingVertical: 5 },
  badgeCompact: { gap: appSpacing.xs, paddingHorizontal: 7, paddingVertical: appSpacing.xs },
  label: { fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
});
