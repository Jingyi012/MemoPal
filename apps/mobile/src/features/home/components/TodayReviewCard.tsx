import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { groupMemoryReviews, type DueMemoryReview } from '@/features/practice-attempts';
import { typography } from '@/theme/typography';
import { ArrowRight } from '@/core/icons';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { isReviewOverdue } from '@/features/practice-attempts/utils/reviewDate';

type TodayReviewCardProps = {
  reviews: DueMemoryReview[];
  visibleCount?: number;
  onOpen: (review: DueMemoryReview) => void;
};

export function TodayReviewCard({ reviews, visibleCount = 2, onOpen }: TodayReviewCardProps) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('home');
  const groupedReviews = groupMemoryReviews(reviews);
  const visibleReviews = groupedReviews.slice(0, visibleCount);
  return (
    <View style={styles.card}>
      <View style={styles.reviewList}>
        {visibleReviews.map(({ review, itemCount }) => {
          const isPeg = review.techniqueKey === 'number-peg';
          return (
            <AnimatedPressable key={review.id} onPress={() => onOpen(review)} style={styles.reviewRow}>
              <View style={[styles.reviewIcon, isPeg ? styles.pegIcon : styles.palaceIcon]}>
                <Text style={styles.reviewEmoji}>{isPeg ? '🕯️' : '🏰'}</Text>
              </View>
              <View style={styles.reviewCopy}>
                <Text numberOfLines={1} style={styles.reviewTitle}>{review.memorySetTitle}</Text>
                <Text numberOfLines={1} style={[styles.reviewMeta, isReviewOverdue(review) && styles.overdueText]}>
                  {isReviewOverdue(review) ? t('overdue') : t('dueToday')} · {itemCount} {itemCount === 1 ? t('itemDue') : t('itemsDue')}
                </Text>
              </View>
              <ArrowRight size={16} color={theme.inkSoft} />
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { borderRadius: 19, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, padding: 13 },
  reviewList: { gap: 7 },
  reviewRow: { minHeight: 54, borderRadius: appRadii.control, backgroundColor: theme.paper, paddingHorizontal: 9, paddingVertical: appSpacing.sm, flexDirection: 'row', alignItems: 'center', gap: 9 },
  reviewIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  reviewEmoji: { fontSize: appTextStyles.body.fontSize },
  pegIcon: { backgroundColor: theme.berryTint },
  palaceIcon: { backgroundColor: theme.violetTint },
  reviewCopy: { flex: 1, minWidth: 0 },
  reviewTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  reviewMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, marginTop: 2 },
  overdueText: { color: theme.berryDeep },
}));
