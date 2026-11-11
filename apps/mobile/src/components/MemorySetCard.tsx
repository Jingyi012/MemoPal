import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { MemoryLearningCard } from '@/components/MemoryLearningCard';
import { MemoryVisibilityBadge } from '@/components/MemoryVisibilityBadge';
import type { MemorySet } from '@/features/memory-sets';
import { getMemorySetPegIcon } from '@/features/memory-sets/utils/memorySetIcon';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useColorScheme } from 'nativewind';
import { memopalThemes, type MemoPalTheme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { ChevronRight, MoreHorizontal } from '@/core/icons';
import { StyleSheet, View } from 'react-native';

type MemorySetCardProps = {
  memorySet: MemorySet;
  reviewAt?: string;
  onOpen: () => void;
  actionLabel?: string;
  onActions?: () => void;
  variant?: 'card' | 'list';
  layout?: 'row' | 'grid';
  coverImageUrl?: string;
  coverImageSource?: number;
};

export function MemorySetCard({
  memorySet,
  reviewAt,
  onOpen,
  actionLabel,
  onActions,
  variant = 'card',
  layout = 'row',
  coverImageUrl,
  coverImageSource,
}: MemorySetCardProps) {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const styles = createStyles(theme);
  const { t } = useTranslation('library');
  const isPalace = memorySet.techniqueKey === 'palace';
  const reviewLabel = memorySet.status === 'draft' ? t('draftSetupHint') : formatReviewLabel(reviewAt, t);
  const reviewIsDue = memorySet.status !== 'draft' && Boolean(reviewAt && Date.parse(reviewAt) <= Date.now());
  const pegIcon = getMemorySetPegIcon(memorySet);
  const artwork = memorySet.emoji ? (
    <Text style={{ fontSize: layout === 'grid' ? appTextStyles.phrase.fontSize : appTextStyles.prompt.fontSize }}>{memorySet.emoji}</Text>
  ) : isPalace && (coverImageUrl || coverImageSource) ? (
    <AppImage imageUrl={coverImageUrl} imageSource={coverImageSource} style={{ width: '100%', height: '100%' }} />
  ) : (
    <Text style={{ fontSize: layout === 'grid' ? appTextStyles.phrase.fontSize : appTextStyles.prompt.fontSize }}>{isPalace ? '🏰' : pegIcon}</Text>
  );

  if (layout === 'grid') {
    return (
      <MemoryLearningCard
        layout="library-grid"
        techniqueKey={memorySet.techniqueKey}
        title={memorySet.title}
        description={memorySet.description ?? undefined}
        metadata={`${memorySet.items.length} ${memorySet.items.length === 1 ? t('item') : t('items')} · ${formatStatus(memorySet, t)}`}
        visibility={memorySet.visibility}
        visibilityLabel={formatVisibility(memorySet.visibility, t)}
        artwork={artwork}
        reviewLabel={reviewLabel}
        reviewIsDue={reviewIsDue}
        onActions={onActions}
        accessibilityLabel={`${memorySet.title}, ${isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}, ${formatStatus(memorySet, t)}, ${formatVisibility(memorySet.visibility, t)}`}
        accessibilityHint={onActions ? t('holdForActions') : undefined}
        onLongPress={onActions}
        onPress={onOpen}
      />
    );
  }

  return (
    <View style={[styles.listCardWrap, variant === 'list' && styles.listCardSurface]}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`${memorySet.title}, ${isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}, ${formatStatus(memorySet, t)}, ${formatVisibility(memorySet.visibility, t)}`}
        accessibilityHint={onActions ? t('holdForActions') : undefined}
        delayLongPress={420}
        onLongPress={onActions}
        onPress={onOpen}
        lively={variant !== 'list'}
        style={variant === 'list' ? styles.listCard : styles.memoryCard}>
        <View style={[styles.techniqueIcon, variant === 'list' && styles.listTechniqueIcon, isPalace ? styles.palaceIcon : styles.pegIcon]}>
          {artwork}
        </View>
        <View style={[styles.memoryCopy, variant === 'list' && styles.listMemoryCopy]}>
          {variant === 'list' ? (
            <View style={[styles.listTechniqueBadge, isPalace ? styles.palaceTechniqueBadge : styles.pegTechniqueBadge]}>
              <Text style={[styles.techniqueLabel, styles.listTechniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
                {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
              </Text>
            </View>
          ) : (
            <Text style={[styles.techniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
              {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
            </Text>
          )}
          <Text numberOfLines={1} style={[styles.memoryTitle, variant === 'list' && styles.listMemoryTitle]}>{memorySet.title}</Text>
          {variant === 'list' ? (
            <>
              <Text numberOfLines={1} style={[styles.memoryMeta, styles.listMemoryMeta]}>
                {memorySet.items.length} {memorySet.items.length === 1 ? t('item') : t('items')} · {formatStatus(memorySet, t)}
              </Text>
              <View style={styles.listReviewRow}>
                <MemoryVisibilityBadge visibility={memorySet.visibility} label={formatVisibility(memorySet.visibility, t)} compact />
                <View style={[styles.listReviewChip, reviewIsDue && styles.listReviewChipDue]}>
                  <Text numberOfLines={1} style={[styles.listReviewText, reviewIsDue && styles.listReviewTextDue]}>{reviewLabel}</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailsRow}>
                <Text numberOfLines={1} style={styles.memoryMeta}>
                  {memorySet.items.length} {memorySet.items.length === 1 ? t('item') : t('items')} · {formatStatus(memorySet, t)}
                </Text>
                <MemoryVisibilityBadge visibility={memorySet.visibility} label={formatVisibility(memorySet.visibility, t)} compact />
              </View>
              <View style={[styles.reviewBadge, reviewIsDue && styles.reviewBadgeDue]}>
                <Text numberOfLines={1} style={[styles.reviewLabel, reviewIsDue && styles.reviewLabelDue]}>
                  {reviewLabel}
                </Text>
              </View>
            </>
          )}
          {actionLabel ? <Text style={styles.actionLabel}>{actionLabel}</Text> : null}
        </View>
        <ChevronRight size={18} color={theme.inkSoft} />
      </AnimatedPressable>
      {onActions ? (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={`${t('openActions')}: ${memorySet.title}`}
          hitSlop={4}
          onPress={onActions}
          style={styles.rowMoreButton}>
          <MoreHorizontal size={19} color={theme.inkSoft} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

function formatStatus(memorySet: MemorySet, t: (key: 'statusArchived' | 'statusDraft' | 'statusReady') => string): string {
  if (memorySet.status === 'archived') return t('statusArchived');
  if (memorySet.status === 'draft') return t('statusDraft');
  return t('statusReady');
}

function formatVisibility(visibility: MemorySet['visibility'], t: (key: 'statusPrivate' | 'statusUnlisted' | 'statusPublic') => string): string {
  if (visibility === 'public') return t('statusPublic');
  if (visibility === 'unlisted') return t('statusUnlisted');
  return t('statusPrivate');
}

function formatReviewLabel(value: string | undefined, t: (key: 'nextReview' | 'reviewDue' | 'reviewAfterRecall') => string): string {
  if (!value) return t('reviewAfterRecall');
  if (Date.parse(value) <= Date.now()) return t('reviewDue');
  const date = new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${t('nextReview')}: ${date}`;
}

const createStyles = (theme: MemoPalTheme) => StyleSheet.create({
  memoryCard: { minHeight: 104, borderRadius: appRadii.card, borderWidth: 1, borderColor: theme.violetLine, backgroundColor: theme.paper, padding: appSpacing.md, flexDirection: 'row', alignItems: 'center', boxShadow: '0px 3px 10px rgba(73,55,154,0.07)' },
  listCardWrap: { position: 'relative', width: '100%' },
  listCardSurface: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 1, boxShadow: '0px 3px 10px rgba(73,55,154,0.06)', flexDirection: 'row', paddingRight: appSpacing.sm, width: '100%' },
  listCard: { alignItems: 'center', flex: 1, flexDirection: 'row', minHeight: 90, minWidth: 0, paddingHorizontal: appSpacing.md, paddingVertical: appSpacing.sm },
  rowMoreButton: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: appRadii.control, flexShrink: 0, height: 40, justifyContent: 'center', marginLeft: 2, width: 40 },
  techniqueIcon: { width: 48, height: 48, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center' },
  listTechniqueIcon: { width: 44, height: 44, borderRadius: appRadii.control, borderWidth: 1.5, borderColor: theme.line, overflow: 'hidden' },
  palaceIcon: { backgroundColor: theme.violetTint },
  pegIcon: { backgroundColor: theme.berryTint },
  memoryCopy: { flex: 1, minWidth: 0, marginHorizontal: appSpacing.md },
  listMemoryCopy: { gap: 3, marginHorizontal: appSpacing.md },
  techniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.8 },
  listTechniqueLabel: { fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.8 },
  listTechniqueBadge: { alignSelf: 'flex-start', borderRadius: appRadii.pill, paddingHorizontal: 7, paddingVertical: 3 },
  palaceTechniqueBadge: { backgroundColor: theme.violetTint },
  pegTechniqueBadge: { backgroundColor: theme.berryTint },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  memoryTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize, marginTop: appSpacing.xs },
  listMemoryTitle: { fontFamily: typography.displayExtraBold, fontSize: appTextStyles.cardTitle.fontSize, marginTop: 3 },
  memoryMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, marginTop: 3, minWidth: 0 },
  listMemoryMeta: { flexShrink: 1, fontSize: appTextStyles.caption.fontSize, marginTop: 0 },
  listReviewRow: { alignItems: 'center', flexDirection: 'row', gap: 6, minWidth: 0 },
  listReviewChip: { backgroundColor: 'transparent', borderRadius: 8, flex: 1, justifyContent: 'center', minHeight: 22, minWidth: 0, paddingHorizontal: 7 },
  listReviewChipDue: { backgroundColor: theme.berryTint },
  listReviewText: { color: theme.inkSoft, flexShrink: 1, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, minWidth: 0 },
  listReviewTextDue: { color: theme.berryDeep },
  reviewLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, marginTop: 3 },
  reviewLabelDue: { color: theme.berryDeep },
  detailsRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  reviewBadge: { alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 9, marginTop: 7, maxWidth: '100%', paddingHorizontal: appSpacing.sm, paddingVertical: 5 },
  reviewBadgeDue: { backgroundColor: theme.berryTint },
  actionLabel: {
    alignSelf: 'flex-start',
    backgroundColor: theme.violetTint,
    borderRadius: 8,
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: appTextStyles.caption.fontSize,
    marginTop: 6,
    paddingHorizontal: appSpacing.sm,
    paddingVertical: appSpacing.xs,
  },
});
