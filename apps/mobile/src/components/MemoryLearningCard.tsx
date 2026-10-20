import AnimatedPressable from '@/components/AnimatedPressable';
import { MemoryVisibilityBadge } from '@/components/MemoryVisibilityBadge';
import type { MemorySetVisibility } from '@/features/memory-sets';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { ArrowRight, CalendarClock, ChevronRight, MoreHorizontal } from '@/core/icons';
import { useTranslation } from '@/core/i18n/useTranslation';
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
  onActions?: () => void;
  layout?: 'grid' | 'library-grid';
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
  onActions,
  layout = 'grid',
  onPress,
  onLongPress,
}: MemoryLearningCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const styles = createStyles(theme);
  const { t } = useTranslation('library');
  const isPalace = techniqueKey === 'palace';
  const compact = screenWidth < 360;

  if (layout === 'library-grid') {
    return (
      <View style={styles.cardWrap}>
        <AnimatedPressable
          lively
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          delayLongPress={420}
          onLongPress={onLongPress}
          onPress={onPress}
          style={styles.libraryGridCard}>
          <LinearGradient
            colors={isPalace ? ['#E8DEFF', '#C5B7FF'] : ['#FFE5CA', '#FFC1B3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.libraryGridCover, compact && styles.libraryGridCoverCompact]}>
            <View pointerEvents="none" style={styles.coverOrb} />
            <View style={styles.libraryGridArtwork}>{artwork}</View>
            <View style={styles.coverTechniqueTag}>
              <Text style={[styles.coverTechniqueText, isPalace ? styles.coverPalaceText : styles.coverPegText]}>
                {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.libraryGridCopy}>
            <Text numberOfLines={2} style={styles.libraryGridTitle}>{title}</Text>
            <Text numberOfLines={2} style={styles.libraryGridDescription}>{description ?? ' '}</Text>
            <View style={styles.libraryGridMetaRow}>
              <Text numberOfLines={1} style={styles.libraryGridMetadata}>{metadata}</Text>
              {visibility && visibilityLabel ? <MemoryVisibilityBadge visibility={visibility} label={visibilityLabel} compact /> : null}
            </View>
            <View style={styles.libraryGridFooter}>
              {reviewLabel ? (
                <View style={styles.libraryGridReview}>
                  <CalendarClock size={12} color={reviewIsDue ? theme.berryDeep : theme.violetDeep} />
                  <Text numberOfLines={1} style={[styles.libraryGridReviewText, reviewIsDue && styles.libraryGridReviewTextDue]}>{reviewLabel}</Text>
                </View>
              ) : <View />}
              <View style={styles.libraryGridOpenAction}>
                <Text style={styles.libraryGridOpenText}>{t('communityOpenAction')}</Text>
                <ArrowRight size={13} color={theme.violetDeep} />
              </View>
            </View>
          </View>
        </AnimatedPressable>
        {onActions ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`${t('openActions')}: ${title}`}
            hitSlop={4}
            onPress={onActions}
            style={styles.libraryGridMoreButton}>
            <MoreHorizontal size={19} color={theme.inkSoft} />
          </AnimatedPressable>
        ) : null}
      </View>
    );
  }

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
  cardWrap: { position: 'relative', width: '100%' },
  libraryGridCard: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 19, borderWidth: 1, boxShadow: '0px 4px 12px rgba(73,55,154,0.08)', overflow: 'hidden', width: '100%' },
  libraryGridCover: { alignItems: 'center', height: 102, justifyContent: 'center', overflow: 'hidden', position: 'relative', width: '100%' },
  libraryGridCoverCompact: { height: 90 },
  coverOrb: { backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 60, height: 120, position: 'absolute', right: -48, top: -35, width: 120 },
  libraryGridArtwork: { alignItems: 'center', height: '100%', justifyContent: 'center', width: '100%' },
  coverTechniqueTag: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, left: 8, paddingHorizontal: 7, paddingVertical: 4, position: 'absolute', top: 8 },
  coverTechniqueText: { fontFamily: typography.bodyExtraBold, fontSize: 8 },
  coverPalaceText: { color: theme.violetDeep },
  coverPegText: { color: theme.berryDeep },
  libraryGridCopy: { gap: 7, minWidth: 0, paddingHorizontal: 11, paddingVertical: 10 },
  libraryGridTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, lineHeight: 18, minHeight: 36 },
  libraryGridDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 14, minHeight: 28 },
  libraryGridMetaRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5, minHeight: 20, minWidth: 0 },
  libraryGridMetadata: { color: theme.inkSoft, flexShrink: 1, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  libraryGridFooter: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'space-between', marginTop: 1, minWidth: 0 },
  libraryGridReview: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: 4, minHeight: 25, minWidth: 0 },
  libraryGridReviewText: { color: theme.violetDeep, flexShrink: 1, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  libraryGridReviewTextDue: { color: theme.berryDeep },
  libraryGridOpenAction: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 999, flexDirection: 'row', gap: 3, minHeight: 28, paddingHorizontal: 8 },
  libraryGridOpenText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  libraryGridMoreButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderColor: theme.line, borderRadius: 15, borderWidth: 1, height: 44, justifyContent: 'center', position: 'absolute', right: 8, top: 8, width: 44, zIndex: 2 },
  card: { width: '100%', borderRadius: 24, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, padding: 13, boxShadow: '0px 4px 14px rgba(122,104,224,0.10)' },
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
