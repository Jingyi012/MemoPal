import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemorySet } from '@/features/memory-sets';
import { useMemoryReviewProgress } from '@/features/practice-attempts';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ChevronRight } from '@/core/icons';
import { StyleSheet, Text, View } from 'react-native';

export function NumberPegMemoryRow({ memorySet, dueCount, onPress }: { memorySet: MemorySet; dueCount: number; onPress: () => void }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('numberPeg');
  const progressQuery = useMemoryReviewProgress(memorySet.id);
  const isBuilding = memorySet.status === 'draft';
  const total = memorySet.items.length;
  const completedCount = isBuilding
    ? Math.min(memorySet.techniquePlan?.pegBindings.length ?? 0, total)
    : progressQuery.data?.items.filter((item) => item.recallSessionsCompleted > 0).length;
  const progress = total > 0 && completedCount !== undefined ? completedCount / total : null;

  return (
    <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.countBadge}>
        <Text style={styles.countNumber}>{total}</Text>
        <Text style={styles.countUnit}>{t('itemUnit')}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>{memorySet.title}</Text>
        <View style={styles.meta}>
          <Text style={[styles.status, isBuilding ? styles.statusBuilding : styles.statusRecall]}>{isBuilding ? t('keepBuilding') : t('readyToRecall')}</Text>
          {dueCount > 0 ? <Text style={styles.dueLabel}>{t('dueCount', { count: dueCount })}</Text> : null}
        </View>
        {progress !== null ? (
          <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: completedCount ?? 0 }}>
            <View style={[styles.progressFill, { width: `${Math.min(1, progress) * 100}%`, backgroundColor: isBuilding ? theme.sunDeep : theme.violetDeep }]} />
          </View>
        ) : null}
      </View>
      <ChevronRight size={18} color={theme.inkSoft} />
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  row: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', gap: 10, minHeight: 80, padding: 11 },
  countBadge: { alignItems: 'center', backgroundColor: theme.berryTint, borderRadius: 14, height: 48, justifyContent: 'center', minWidth: 48, paddingHorizontal: 5 },
  countNumber: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 17, lineHeight: 20 },
  countUnit: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  copy: { flex: 1, gap: 3, minWidth: 0 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13 },
  meta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  status: { borderRadius: 999, fontFamily: typography.bodyExtraBold, fontSize: 9, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 3 },
  statusRecall: { backgroundColor: theme.violetTint, color: theme.violetDeep },
  statusBuilding: { backgroundColor: theme.sunTint, color: theme.sunDeep },
  dueLabel: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 9 },
  progressTrack: { backgroundColor: theme.violetTint, borderRadius: 99, height: 4, marginTop: 3, overflow: 'hidden' },
  progressFill: { backgroundColor: theme.violetDeep, borderRadius: 99, height: '100%' },
}));
