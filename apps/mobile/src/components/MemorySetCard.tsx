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
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

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
    <Text style={{ fontSize: layout === 'grid' ? 29 : 22 }}>{memorySet.emoji}</Text>
  ) : isPalace && (coverImageUrl || coverImageSource) ? (
    <AppImage imageUrl={coverImageUrl} imageSource={coverImageSource} style={{ width: '100%', height: '100%' }} />
  ) : (
    <Text style={{ fontSize: layout === 'grid' ? 29 : 22 }}>{isPalace ? '🏰' : pegIcon}</Text>
  );

  if (layout === 'grid') {
    return (
      <MemoryLearningCard
        techniqueKey={memorySet.techniqueKey}
        title={memorySet.title}
        description={memorySet.description ?? undefined}
        metadata={`${memorySet.items.length} ${memorySet.items.length === 1 ? t('item') : t('items')} · ${formatStatus(memorySet, t)}`}
        visibility={memorySet.visibility}
        visibilityLabel={formatVisibility(memorySet.visibility, t)}
        artwork={artwork}
        reviewLabel={reviewLabel}
        reviewIsDue={reviewIsDue}
        accessibilityLabel={`${memorySet.title}, ${isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}, ${formatStatus(memorySet, t)}, ${formatVisibility(memorySet.visibility, t)}`}
        accessibilityHint={onActions ? t('holdForActions') : undefined}
        onLongPress={onActions}
        onPress={onOpen}
      />
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${memorySet.title}, ${isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}, ${formatStatus(memorySet, t)}, ${formatVisibility(memorySet.visibility, t)}`}
      accessibilityHint={onActions ? t('holdForActions') : undefined}
      delayLongPress={420}
      onLongPress={onActions}
      onPress={onOpen}
      lively={variant === 'list'}
      style={[styles.memoryCard, variant === 'list' && styles.listCard]}>
      <View style={[styles.techniqueIcon, variant === 'list' && styles.listTechniqueIcon, isPalace ? styles.palaceIcon : styles.pegIcon]}>
        {artwork}
      </View>
      <View style={[styles.memoryCopy, variant === 'list' && styles.listMemoryCopy]}>
        <Text style={[styles.techniqueLabel, variant === 'list' && styles.listTechniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
          {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
        </Text>
        <Text numberOfLines={1} style={[styles.memoryTitle, variant === 'list' && styles.listMemoryTitle]}>{memorySet.title}</Text>
        <View style={styles.detailsRow}>
          <Text numberOfLines={1} style={[styles.memoryMeta, variant === 'list' && styles.listMemoryMeta]}>
            {memorySet.items.length} {memorySet.items.length === 1 ? t('item') : t('items')} · {formatStatus(memorySet, t)}
          </Text>
          <MemoryVisibilityBadge visibility={memorySet.visibility} label={formatVisibility(memorySet.visibility, t)} compact />
        </View>
        <View style={[styles.reviewBadge, reviewIsDue && styles.reviewBadgeDue]}>
          <Text numberOfLines={1} style={[styles.reviewLabel, variant === 'list' && styles.listReviewLabel, reviewIsDue && styles.reviewLabelDue]}>
            {reviewLabel}
          </Text>
        </View>
        {actionLabel ? <Text style={styles.actionLabel}>{actionLabel}</Text> : null}
      </View>
      <ChevronRight size={18} color={theme.inkSoft} />
    </AnimatedPressable>
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
  memoryCard: { minHeight: 104, borderRadius: 24, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 13, flexDirection: 'row', alignItems: 'center' },
  listCard: { minHeight: 94, borderRadius: 24, borderWidth: 1.5, paddingHorizontal: 13, paddingVertical: 12, boxShadow: '0px 4px 14px rgba(122,104,224,0.10)' },
  techniqueIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  listTechniqueIcon: { width: 44, height: 44, borderRadius: 16, borderWidth: 1.5, borderColor: theme.line, overflow: 'hidden' },
  palaceIcon: { backgroundColor: theme.violetTint },
  pegIcon: { backgroundColor: theme.berryTint },
  memoryCopy: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  listMemoryCopy: { marginHorizontal: 12 },
  techniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.8 },
  listTechniqueLabel: { fontSize: 9.5, letterSpacing: 0.8 },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  memoryTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, marginTop: 4 },
  listMemoryTitle: { fontFamily: typography.displayExtraBold, fontSize: 16, marginTop: 3 },
  memoryMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3, minWidth: 0 },
  listMemoryMeta: { flexShrink: 1, fontSize: 10, marginTop: 0 },
  reviewLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 3 },
  listReviewLabel: { flexShrink: 1, fontSize: 10, marginTop: 0 },
  reviewLabelDue: { color: theme.berryDeep },
  detailsRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  reviewBadge: { alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 9, marginTop: 7, maxWidth: '100%', paddingHorizontal: 8, paddingVertical: 5 },
  reviewBadgeDue: { backgroundColor: theme.berryTint },
  actionLabel: {
    alignSelf: 'flex-start',
    backgroundColor: theme.violetTint,
    borderRadius: 8,
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 11,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
