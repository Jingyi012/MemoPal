import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemorySet } from '@/features/memory-sets';
import { useTranslation } from '@/core/i18n/useTranslation';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { Archive, ChevronRight, MoreHorizontal } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

type MemorySetCardProps = {
  memorySet: MemorySet;
  reviewAt?: string;
  onOpen: () => void;
  onActions?: () => void;
};

export function MemorySetCard({ memorySet, reviewAt, onOpen, onActions }: MemorySetCardProps) {
  const { t } = useTranslation('library');
  const isPalace = memorySet.techniqueKey === 'palace';
  const updatedLabel = formatUpdatedAt(memorySet.updatedAt, t);
  const reviewLabel = formatReviewLabel(reviewAt, t);

  return (
    <AnimatedPressable onPress={onOpen} style={styles.memoryCard}>
      <View style={[styles.techniqueIcon, isPalace ? styles.palaceIcon : styles.pegIcon]}>
        <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
      </View>
      <View style={styles.memoryCopy}>
        <Text style={[styles.techniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
          {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
        </Text>
        <Text numberOfLines={1} style={styles.memoryTitle}>{memorySet.title}</Text>
        <View style={styles.memoryMetaRow}>
          <Text numberOfLines={1} style={styles.memoryMeta}>
            {memorySet.items.length} {memorySet.items.length === 1 ? t('item') : t('items')} ·{' '}
            {memorySet.status === 'archived'
              ? t('statusArchived')
              : memorySet.status === 'draft'
                ? t('statusDraft')
                : t('statusReady')}
          </Text>
          {updatedLabel ? <Text style={styles.updatedLabel}>{updatedLabel}</Text> : null}
        </View>
        <Text numberOfLines={1} style={[styles.reviewLabel, reviewAt && Date.parse(reviewAt) <= Date.now() && styles.reviewLabelDue]}>
          {reviewLabel}
        </Text>
      </View>
      {onActions ? (
        <AnimatedPressable
          accessibilityLabel={`${t('moreActions')} ${memorySet.title}`}
          onPress={(event) => {
            event.stopPropagation();
            onActions();
          }}
          style={styles.moreButton}>
          {memorySet.status === 'archived'
            ? <Archive size={18} color={theme.inkSoft} />
            : <MoreHorizontal size={20} color={theme.inkSoft} />}
        </AnimatedPressable>
      ) : null}
      <ChevronRight size={18} color={theme.inkSoft} />
    </AnimatedPressable>
  );
}

function formatUpdatedAt(value: string, t: (key: 'today' | 'yesterday' | 'daysAgo') => string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';

  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return t('today');
  if (days === 1) return t('yesterday');
  if (days < 7) return `${days}${t('daysAgo')}`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
  techniqueIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  techniqueEmoji: { fontSize: 22 },
  palaceIcon: { backgroundColor: '#EEE9FF' },
  pegIcon: { backgroundColor: '#FFF0F4' },
  memoryCopy: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  techniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.8 },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  memoryTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, marginTop: 4 },
  memoryMetaRow: { alignItems: 'center', flexDirection: 'row', marginTop: 3 },
  memoryMeta: { color: theme.inkSoft, flex: 1, fontFamily: typography.bodyBold, fontSize: 11, minWidth: 0 },
  updatedLabel: { color: '#9A97A7', fontFamily: typography.bodyBold, fontSize: 10, marginLeft: 8 },
  reviewLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5, marginTop: 3 },
  reviewLabelDue: { color: theme.berryDeep },
  moreButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
