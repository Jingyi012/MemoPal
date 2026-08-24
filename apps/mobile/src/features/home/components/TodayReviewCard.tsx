import AnimatedPressable from '@/components/AnimatedPressable';
import type { DueMemoryReview } from '@/features/practice-attempts';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { ArrowRight, Clock3, Hash, MapPinned } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export function TodayReviewCard({ reviews, onOpen }: { reviews: DueMemoryReview[]; onOpen: (review: DueMemoryReview) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}><Clock3 size={20} color={theme.violetDeep} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>TODAY’S MEMORY WALK</Text>
          <Text style={styles.title}>{reviews.length} review{reviews.length === 1 ? '' : 's'} waiting for you</Text>
          <Text style={styles.subtitle}>Recall first. Every answer helps the next review find its rhythm.</Text>
        </View>
      </View>
      <View style={styles.reviewList}>
        {reviews.slice(0, 3).map((review) => {
          const isPeg = review.techniqueKey === 'number-peg';
          return (
            <AnimatedPressable key={review.id} onPress={() => onOpen(review)} style={styles.reviewRow}>
              <View style={[styles.reviewIcon, isPeg ? styles.pegIcon : styles.palaceIcon]}>
                {isPeg ? <Hash size={16} color={theme.berryDeep} /> : <MapPinned size={16} color={theme.violetDeep} />}
              </View>
              <View style={styles.reviewCopy}>
                <Text numberOfLines={1} style={styles.reviewTitle}>{review.memorySetTitle}</Text>
                <Text numberOfLines={1} style={styles.reviewMeta}>Item {review.itemPosition} · {review.prompt}</Text>
              </View>
              <ArrowRight size={16} color={theme.inkSoft} />
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 21, borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: '#F7F5FF', padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: theme.violetDeep, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: theme.ink, fontSize: 15, fontWeight: '900', marginTop: 3 },
  subtitle: { color: theme.inkSoft, fontSize: 11.5, lineHeight: 17, fontWeight: '700', marginTop: 3 },
  reviewList: { gap: 7, marginTop: 12 },
  reviewRow: { minHeight: 54, borderRadius: 14, backgroundColor: 'white', paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 9 },
  reviewIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pegIcon: { backgroundColor: '#FFF0F4' },
  palaceIcon: { backgroundColor: '#EEE9FF' },
  reviewCopy: { flex: 1, minWidth: 0 },
  reviewTitle: { color: theme.ink, fontSize: 12.5, fontWeight: '900' },
  reviewMeta: { color: theme.inkSoft, fontSize: 10.5, fontWeight: '700', marginTop: 2 },
});
