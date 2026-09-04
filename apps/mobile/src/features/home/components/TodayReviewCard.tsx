import AnimatedPressable from '@/components/AnimatedPressable';
import { groupMemoryReviews, type DueMemoryReview } from '@/features/practice-attempts';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

type TodayReviewCardProps = {
  reviews: DueMemoryReview[];
  onOpen: (review: DueMemoryReview) => void;
  onStartReview?: (review: DueMemoryReview) => void;
};

export function TodayReviewCard({ reviews, onOpen, onStartReview }: TodayReviewCardProps) {
  const { t } = useTranslation('home');
  const groupedReviews = groupMemoryReviews(reviews);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}><Text style={styles.headerEmoji}>⏰</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{t('todayMemoryWalk')}</Text>
          <Text style={styles.title}>
            {groupedReviews.length === 1
              ? t('oneReviewWaiting')
              : t('reviewsWaitingForYou').replace('{count}', String(groupedReviews.length))}
          </Text>
          <Text style={styles.subtitle}>{t('todayReviewBody')}</Text>
        </View>
      </View>
      <View style={styles.reviewList}>
        {groupedReviews.slice(0, 3).map(({ review, itemCount }) => {
          const isPeg = review.techniqueKey === 'number-peg';
          return (
            <AnimatedPressable key={review.id} onPress={() => onOpen(review)} style={styles.reviewRow}>
              <View style={[styles.reviewIcon, isPeg ? styles.pegIcon : styles.palaceIcon]}>
                <Text style={styles.reviewEmoji}>{isPeg ? '🕯️' : '🏰'}</Text>
              </View>
              <View style={styles.reviewCopy}>
                <Text numberOfLines={1} style={styles.reviewTitle}>{review.memorySetTitle}</Text>
                <Text numberOfLines={1} style={[styles.reviewMeta, isOverdue(review.dueAt) && styles.overdueText]}>
                  {isOverdue(review.dueAt) ? t('overdue') : t('dueToday')} · {itemCount} {itemCount === 1 ? t('itemDue') : t('itemsDue')}
                </Text>
              </View>
              <ArrowRight size={16} color={theme.inkSoft} />
            </AnimatedPressable>
          );
        })}
      </View>
      {onStartReview ? (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t('startTodayReviewAccessibility')}
          onPress={() => onStartReview(groupedReviews[0].review)}
          style={styles.startButton}>
          <Text style={styles.startButtonText}>{t('startReview')}</Text>
          <ArrowRight size={17} color={theme.ink} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

function isOverdue(dueAt: string) {
  return new Date(dueAt).getTime() < Date.now();
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 21, borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: '#F7F5FF', padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' },
  headerEmoji: { fontSize: 21 },
  eyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.7 },
  title: { color: theme.ink, fontFamily: typography.display, fontSize: 15, marginTop: 3 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
  reviewList: { gap: 7, marginTop: 12 },
  reviewRow: { minHeight: 54, borderRadius: 14, backgroundColor: 'white', paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 9 },
  reviewIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  reviewEmoji: { fontSize: 15 },
  pegIcon: { backgroundColor: '#FFF0F4' },
  palaceIcon: { backgroundColor: '#EEE9FF' },
  reviewCopy: { flex: 1, minWidth: 0 },
  reviewTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12.5 },
  reviewMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 2 },
  overdueText: { color: theme.berryDeep },
  startButton: { minHeight: 44, borderRadius: 13, backgroundColor: theme.sun, marginTop: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  startButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12.5 },
});
