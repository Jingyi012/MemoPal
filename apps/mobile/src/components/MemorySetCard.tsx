import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { MemoryLearningCard } from '@/components/MemoryLearningCard';
import { MemoryVisibilityBadge } from '@/components/MemoryVisibilityBadge';
import type { MemorySet } from '@/features/memory-sets';
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
  const pegVisuals = getPegVisuals(memorySet);
  const pegIcon = pegVisuals[0];

  if (layout === 'grid') {
    const artwork = memorySet.emoji ? (
      <Text style={{ fontSize: 29 }}>{memorySet.emoji}</Text>
    ) : isPalace && (coverImageUrl || coverImageSource) ? (
      <AppImage imageUrl={coverImageUrl} imageSource={coverImageSource} style={{ width: '100%', height: '100%' }} />
    ) : (
      <Text style={{ fontSize: 29 }}>{isPalace ? '🏰' : pegIcon}</Text>
    );

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
      style={[styles.memoryCard, variant === 'list' && styles.listCard]}>
      <View style={[styles.techniqueIcon, variant === 'list' && styles.listTechniqueIcon, isPalace ? styles.palaceIcon : styles.pegIcon]}>
        <Text style={[styles.techniqueEmoji, variant === 'list' && styles.listTechniqueEmoji]}>{memorySet.emoji || (isPalace ? '🏰' : pegIcon)}</Text>
      </View>
      <View style={[styles.memoryCopy, variant === 'list' && styles.listMemoryCopy]}>
        <Text style={[styles.techniqueLabel, variant === 'list' && styles.listTechniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
          {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
        </Text>
        <Text numberOfLines={1} style={[styles.memoryTitle, variant === 'list' && styles.listMemoryTitle]}>{memorySet.title}</Text>
        <Text numberOfLines={1} style={[styles.memoryMeta, variant === 'list' && styles.listMemoryMeta]}>
          {memorySet.items.length} {memorySet.items.length === 1 ? t('item') : t('items')} · {formatStatus(memorySet, t)}
        </Text>
        <MemoryVisibilityBadge visibility={memorySet.visibility} label={formatVisibility(memorySet.visibility, t)} compact />
        <Text numberOfLines={1} style={[styles.reviewLabel, variant === 'list' && styles.listReviewLabel, reviewIsDue && styles.reviewLabelDue]}>
          {reviewLabel}
        </Text>
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
  listCard: { minHeight: 70, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 9 },
  techniqueIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  listTechniqueIcon: { width: 40, height: 40, borderRadius: 13 },
  techniqueEmoji: { color: theme.ink, fontSize: 22 },
  listTechniqueEmoji: { fontSize: 18 },
  palaceIcon: { backgroundColor: theme.violetTint },
  pegIcon: { backgroundColor: theme.berryTint },
  memoryCopy: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  listMemoryCopy: { marginHorizontal: 10 },
  techniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.8 },
  listTechniqueLabel: { fontSize: 10, letterSpacing: 0.65 },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  memoryTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, marginTop: 4 },
  listMemoryTitle: { fontSize: 14, marginTop: 2 },
  memoryMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3, minWidth: 0 },
  listMemoryMeta: { fontSize: 10, marginTop: 2 },
  reviewLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 3 },
  listReviewLabel: { fontSize: 9, marginTop: 2 },
  reviewLabelDue: { color: theme.berryDeep },
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

function getPegVisuals(memorySet: MemorySet): string[] {
  const used = new Set<string>();
  const visuals = memorySet.items
    .slice()
    .sort((left, right) => left.position - right.position)
    .map((item) => {
      const answerInitial = Array.from(item.answer.trim())[0]?.toUpperCase() || '';
      const visual = answerInitial && !used.has(answerInitial) ? answerInitial : `#${item.position}`;
      used.add(visual);
      return visual;
    })
    .filter(Boolean)
    .slice(0, 3);
  if (visuals.length) return visuals;
  const fallback = memorySet.items[0]?.answer?.trim();
  return [fallback ? fallback.slice(0, 1).toUpperCase() : '🕯️'];
}
