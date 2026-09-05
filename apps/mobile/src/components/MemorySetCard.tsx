import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import type { MemorySet } from '@/features/memory-sets';
import { useTranslation } from '@/core/i18n/useTranslation';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { CalendarClock, ChevronRight } from 'lucide-react-native';
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
  const { t } = useTranslation('library');
  const isPalace = memorySet.techniqueKey === 'palace';
  const reviewLabel = formatReviewLabel(reviewAt, t);
  const reviewIsDue = Boolean(reviewAt && Date.parse(reviewAt) <= Date.now());
  const pegVisuals = getPegVisuals(memorySet);
  const pegIcon = pegVisuals[0];
  const pegPalette = PEG_COVER_PALETTES[hashText(memorySet.id) % PEG_COVER_PALETTES.length];

  return (
    <AnimatedPressable
      accessibilityHint={onActions ? t('holdForActions') : undefined}
      delayLongPress={420}
      onLongPress={onActions}
      onPress={onOpen}
      style={[styles.memoryCard, variant === 'list' && styles.listCard, layout === 'grid' && styles.gridCard]}>
      {layout === 'grid' ? (
        <>
          <View style={[styles.gridCover, isPalace ? styles.palaceCover : [styles.pegCover, { backgroundColor: pegPalette.background }]]}>
            {isPalace && (coverImageUrl || coverImageSource) ? (
              <AppImage imageUrl={coverImageUrl} imageSource={coverImageSource} style={styles.coverImage} />
            ) : (
              <>
                <View style={styles.posterOrbLarge} />
                <View style={styles.posterOrbSmall} />
                {isPalace ? <Text style={styles.posterPegIcon}>🏰</Text> : (
                  <View style={styles.pegVisualStack}>
                    {pegVisuals.map((visual, index) => (
                      <View key={`${visual}-${index}`} style={[styles.visualBadge, index > 0 && styles.visualBadgeSecondary]}>
                        <Text style={styles.visualBadgeText}>{visual}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {!isPalace && memorySet.items[0]?.answer ? (
                  <Text numberOfLines={1} style={styles.posterWord}>{memorySet.items[0].answer}</Text>
                ) : null}
              </>
            )}
            <View style={[styles.coverBadge, isPalace ? styles.palaceCoverBadge : styles.pegCoverBadge]}>
              <Text style={styles.coverBadgeEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
            </View>
          </View>

          <View style={styles.gridBody}>
            <Text style={[styles.gridTechniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
              {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
            </Text>
            <Text numberOfLines={2} style={styles.gridTitle}>{memorySet.title}</Text>
            <Text numberOfLines={1} style={styles.gridMeta}>
              {memorySet.items.length} {memorySet.items.length === 1 ? t('item') : t('items')} · {formatStatus(memorySet, t)} · {formatVisibility(memorySet.visibility, t)}
            </Text>
            <View style={[styles.gridReview, reviewIsDue && styles.gridReviewDue]}>
              <CalendarClock size={12} color={reviewIsDue ? theme.berryDeep : theme.violetDeep} />
              <Text numberOfLines={1} style={[styles.gridReviewText, reviewIsDue && styles.reviewLabelDue]}>
                {reviewLabel}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={[styles.techniqueIcon, variant === 'list' && styles.listTechniqueIcon, isPalace ? styles.palaceIcon : styles.pegIcon]}>
            <Text style={[styles.techniqueEmoji, variant === 'list' && styles.listTechniqueEmoji]}>{isPalace ? '🏰' : pegIcon}</Text>
          </View>
          <View style={[styles.memoryCopy, variant === 'list' && styles.listMemoryCopy]}>
            <Text style={[styles.techniqueLabel, variant === 'list' && styles.listTechniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
              {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
            </Text>
            <Text numberOfLines={1} style={[styles.memoryTitle, variant === 'list' && styles.listMemoryTitle]}>{memorySet.title}</Text>
            <Text numberOfLines={1} style={[styles.memoryMeta, variant === 'list' && styles.listMemoryMeta]}>
              {memorySet.items.length} {memorySet.items.length === 1 ? t('item') : t('items')} · {formatStatus(memorySet, t)} · {formatVisibility(memorySet.visibility, t)}
            </Text>
            <Text numberOfLines={1} style={[styles.reviewLabel, variant === 'list' && styles.listReviewLabel, reviewIsDue && styles.reviewLabelDue]}>
              {reviewLabel}
            </Text>
            {actionLabel ? <Text style={styles.actionLabel}>{actionLabel}</Text> : null}
          </View>
          <ChevronRight size={18} color={theme.inkSoft} />
        </>
      )}
    </AnimatedPressable>
  );
}

function formatStatus(memorySet: MemorySet, t: (key: 'statusArchived' | 'statusDraft' | 'statusReady') => string): string {
  if (memorySet.status === 'archived') return t('statusArchived');
  if (memorySet.status === 'draft') return t('statusDraft');
  return t('statusReady');
}

function formatVisibility(visibility: MemorySet['visibility'], t: (key: 'statusPrivate' | 'statusPublic') => string): string {
  return visibility === 'public' ? t('statusPublic') : t('statusPrivate');
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

const styles = StyleSheet.create({
  memoryCard: { minHeight: 90, borderRadius: 20, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 13, flexDirection: 'row', alignItems: 'center' },
  listCard: { minHeight: 70, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 9 },
  gridCard: { minHeight: 0, borderRadius: 18, borderWidth: 1.5, padding: 0, alignItems: 'stretch', flexDirection: 'column', overflow: 'hidden', boxShadow: '0px 4px 14px rgba(122,104,224,0.10)' },
  gridCover: { height: 108, width: '100%', overflow: 'hidden', position: 'relative' },
  palaceCover: { backgroundColor: theme.violetTint },
  pegCover: { alignItems: 'center', justifyContent: 'center' },
  coverImage: { height: '100%', width: '100%' },
  coverBadge: { alignItems: 'center', borderRadius: 10, height: 30, justifyContent: 'center', left: 9, position: 'absolute', top: 9, width: 30 },
  palaceCoverBadge: { backgroundColor: 'rgba(255,255,255,0.90)' },
  pegCoverBadge: { backgroundColor: 'rgba(255,255,255,0.84)' },
  coverBadgeEmoji: { fontSize: 15 },
  posterOrbLarge: { backgroundColor: 'rgba(255,111,145,0.14)', borderRadius: 64, height: 128, position: 'absolute', right: -32, top: -38, width: 128 },
  posterOrbSmall: { backgroundColor: 'rgba(155,140,255,0.14)', borderRadius: 35, bottom: -18, height: 70, left: -14, position: 'absolute', width: 70 },
  posterPegIcon: { fontSize: 38 },
  pegVisualStack: { alignItems: 'center', flexDirection: 'row', gap: 2, justifyContent: 'center', minHeight: 44 },
  visualBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderColor: 'rgba(255,255,255,0.9)', borderRadius: 18, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  visualBadgeSecondary: { height: 35, marginLeft: -3, width: 35 },
  visualBadgeText: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 19 },
  posterWord: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 12, marginTop: 4, maxWidth: '74%' },
  gridBody: { paddingHorizontal: 11, paddingTop: 11, paddingBottom: 12 },
  gridTechniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: 8.5, letterSpacing: 0.7, textTransform: 'uppercase' },
  gridTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16, lineHeight: 20, marginTop: 4 },
  gridMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, marginTop: 3 },
  gridReview: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 9, flexDirection: 'row', gap: 4, marginTop: 9, maxWidth: '100%', paddingHorizontal: 7, paddingVertical: 5 },
  gridReviewDue: { backgroundColor: theme.berryTint },
  gridReviewText: { color: theme.violetDeep, flexShrink: 1, fontFamily: typography.bodyExtraBold, fontSize: 8.5 },
  techniqueIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  listTechniqueIcon: { width: 40, height: 40, borderRadius: 13 },
  techniqueEmoji: { fontSize: 22 },
  listTechniqueEmoji: { fontSize: 18 },
  palaceIcon: { backgroundColor: '#EEE9FF' },
  pegIcon: { backgroundColor: '#FFF0F4' },
  memoryCopy: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  listMemoryCopy: { marginHorizontal: 10 },
  techniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.8 },
  listTechniqueLabel: { fontSize: 8.5, letterSpacing: 0.65 },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  memoryTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, marginTop: 4 },
  listMemoryTitle: { fontSize: 14, marginTop: 2 },
  memoryMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3, minWidth: 0 },
  listMemoryMeta: { fontSize: 10, marginTop: 2 },
  reviewLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5, marginTop: 3 },
  listReviewLabel: { fontSize: 9, marginTop: 2 },
  reviewLabelDue: { color: theme.berryDeep },
  actionLabel: {
    alignSelf: 'flex-start',
    backgroundColor: theme.violetTint,
    borderRadius: 8,
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 9.5,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

const PEG_COVER_PALETTES = [
  { background: '#FFF0F4' },
  { background: '#FFF7DD' },
  { background: '#EEE9FF' },
  { background: '#EAF8F5' },
];

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

function hashText(value: string) {
  return [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);
}
