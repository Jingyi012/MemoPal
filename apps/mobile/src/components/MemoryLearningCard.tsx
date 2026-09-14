import AnimatedPressable from '@/components/AnimatedPressable';
import { MemoryVisibilityBadge } from '@/components/MemoryVisibilityBadge';
import type { MemorySetVisibility } from '@/features/memory-sets';
import { useColorScheme } from 'nativewind';
import { CalendarClock, ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { memopalThemes, type MemoPalTheme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';

type MemoryLearningCardProps = {
  techniqueKey: 'palace' | 'number-peg';
  title: string;
  description?: string;
  metadata: string;
  secondaryMetadata?: string;
  visibility?: MemorySetVisibility;
  visibilityLabel?: string;
  artwork: ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
  reviewLabel?: string;
  reviewIsDue?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

/** The shared card treatment for personal memories and lessons in the catalogue. */
export function MemoryLearningCard({
  techniqueKey,
  title,
  description,
  metadata,
  secondaryMetadata,
  visibility,
  visibilityLabel,
  artwork,
  accessibilityLabel,
  accessibilityHint,
  reviewLabel,
  reviewIsDue = false,
  onPress,
  onLongPress,
}: MemoryLearningCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const styles = createStyles(theme);
  const isPalace = techniqueKey === 'palace';
  const compact = screenWidth < 360;

  return (
    <AnimatedPressable
      lively
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      delayLongPress={420}
      onLongPress={onLongPress}
      onPress={onPress}
      style={styles.card}>
      <View pointerEvents="none" accessibilityElementsHidden style={[styles.techniqueWatermark, compact && styles.techniqueWatermarkCompact]}>
        {isPalace
          ? <Text style={styles.palaceWatermark}>🏰</Text>
          : <Text style={styles.numberPegWatermark}>1 · 2 · 3</Text>}
      </View>
      <View style={styles.header}>
        <View style={[styles.artwork, compact && styles.artworkCompact, isPalace ? styles.artworkPalace : styles.artworkPeg]}>
          {artwork}
        </View>
        <View style={[styles.chevron, compact && styles.chevronCompact]}>
          <ChevronRight size={18} color={theme.violetDeep} />
        </View>
      </View>

      <Text numberOfLines={2} style={styles.title}>{title}</Text>
      {description ? <Text numberOfLines={3} style={styles.description}>{description}</Text> : null}
      <View style={styles.footer}>
        <Text numberOfLines={1} style={styles.metadata}>{metadata}</Text>
        {secondaryMetadata ? <Text numberOfLines={1} style={styles.secondaryMetadata}>{secondaryMetadata}</Text> : null}
        {visibility && visibilityLabel ? <MemoryVisibilityBadge visibility={visibility} label={visibilityLabel} compact /> : null}
        {reviewLabel ? (
          <View style={[styles.review, reviewIsDue && styles.reviewDue]}>
            <CalendarClock size={12} color={reviewIsDue ? theme.berryDeep : theme.violetDeep} />
            <Text numberOfLines={1} style={[styles.reviewText, reviewIsDue && styles.reviewTextDue]}>{reviewLabel}</Text>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const createStyles = (theme: MemoPalTheme) => StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: 13,
    boxShadow: '0px 4px 14px rgba(122,104,224,0.10)',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  techniqueWatermark: { position: 'absolute', top: 15, right: 45, width: 30, height: 25, alignItems: 'center', justifyContent: 'center', opacity: 0.2 },
  techniqueWatermarkCompact: { right: 42, width: 26 },
  palaceWatermark: { fontSize: 21 },
  numberPegWatermark: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 10, letterSpacing: 0.25 },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artworkCompact: { width: 40, height: 40, borderRadius: 15 },
  artworkPalace: { backgroundColor: theme.violetTint },
  artworkPeg: { backgroundColor: theme.berryTint },
  chevron: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' },
  chevronCompact: { width: 28, height: 28, borderRadius: 14 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16, lineHeight: 21, marginTop: 12 },
  description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, marginTop: 5 },
  footer: { marginTop: 12, gap: 8 },
  metadata: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, lineHeight: 14 },
  secondaryMetadata: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9, lineHeight: 13 },
  review: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 9, flexDirection: 'row', gap: 4, maxWidth: '100%', paddingHorizontal: 7, paddingVertical: 5 },
  reviewDue: { backgroundColor: theme.berryTint },
  reviewText: { color: theme.violetDeep, flexShrink: 1, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  reviewTextDue: { color: theme.berryDeep },
});
