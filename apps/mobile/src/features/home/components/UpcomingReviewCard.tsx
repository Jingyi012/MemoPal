import AnimatedPressable from '@/components/AnimatedPressable';
import { groupMemoryReviews, type DueMemoryReview } from '@/features/practice-attempts';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { ArrowRight, CalendarClock } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

export function UpcomingReviewCard({
  reviews,
  onOpen,
}: {
  reviews: DueMemoryReview[];
  onOpen: (review: DueMemoryReview) => void;
}) {
  const { language, t } = useTranslation('home');
  const groupedReviews = groupMemoryReviews(reviews);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}><CalendarClock size={19} color={theme.violetDeep} /></View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{t('upcomingReviews')}</Text>
          <Text style={styles.title}>{t('upcomingReviewsTitle')}</Text>
          <Text style={styles.subtitle}>{t('upcomingReviewsBody')}</Text>
        </View>
      </View>
      <View style={styles.list}>
        {groupedReviews.slice(0, 3).map(({ review, itemCount }) => (
          <AnimatedPressable key={review.memorySetId} onPress={() => onOpen(review)} style={styles.row}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{formatShortDate(review.dueAt, language)}</Text>
            </View>
            <View style={styles.copy}>
              <Text numberOfLines={1} style={styles.rowTitle}>{review.memorySetTitle}</Text>
              <Text style={styles.rowMeta}>{itemCount} {itemCount === 1 ? t('itemDue') : t('itemsDue')}</Text>
            </View>
            <ArrowRight size={16} color={theme.inkSoft} />
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}

function formatShortDate(value: string, language: 'en' | 'zh') {
  return new Date(value).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 21, borderWidth: 2, borderColor: '#E0D9FF', backgroundColor: '#FBFAFF', padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.7 },
  title: { color: theme.ink, fontFamily: typography.display, fontSize: 15, marginTop: 3 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
  list: { gap: 7, marginTop: 12 },
  row: { minHeight: 54, borderRadius: 14, backgroundColor: 'white', paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 9 },
  dateBadge: { minWidth: 56, borderRadius: 10, backgroundColor: '#F2EEFF', paddingHorizontal: 7, paddingVertical: 7, alignItems: 'center' },
  dateText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  rowTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12.5 },
  rowMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 2 },
});
