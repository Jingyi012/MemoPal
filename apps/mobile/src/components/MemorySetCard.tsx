import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemorySet } from '@/features/memory-sets';
import { useTranslation } from '@/core/i18n/useTranslation';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { ChevronRight } from 'lucide-react-native';
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
  const reviewLabel = formatReviewLabel(reviewAt, t);

  return (
    <AnimatedPressable
      accessibilityHint={onActions ? t('holdForActions') : undefined}
      delayLongPress={420}
      onLongPress={onActions}
      onPress={onOpen}
      style={styles.memoryCard}>
      <View style={[styles.techniqueIcon, isPalace ? styles.palaceIcon : styles.pegIcon]}>
        <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
      </View>
      <View style={styles.memoryCopy}>
        <Text style={[styles.techniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
          {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
        </Text>
        <Text numberOfLines={1} style={styles.memoryTitle}>{memorySet.title}</Text>
        <Text numberOfLines={1} style={styles.memoryMeta}>
          {memorySet.items.length} {memorySet.items.length === 1 ? t('item') : t('items')} ·{' '}
          {memorySet.status === 'archived'
            ? t('statusArchived')
            : memorySet.status === 'draft'
              ? t('statusDraft')
              : t('statusReady')}
        </Text>
        <Text numberOfLines={1} style={[styles.reviewLabel, reviewAt && Date.parse(reviewAt) <= Date.now() && styles.reviewLabelDue]}>
          {reviewLabel}
        </Text>
      </View>
      <ChevronRight size={18} color={theme.inkSoft} />
    </AnimatedPressable>
  );
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
  memoryMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3, minWidth: 0 },
  reviewLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5, marginTop: 3 },
  reviewLabelDue: { color: theme.berryDeep },
});
