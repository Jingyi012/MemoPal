import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { LearningChoiceMenu } from '@/features/education/components/LearningChoiceMenu';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useMemorySets } from '@/features/memory-sets';
import { useDueMemoryReviews } from '@/features/practice-attempts';
import { NumberPegMemoryRow } from '@/features/number-peg/components/NumberPegMemoryRow';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';

type MemoryFilter = 'all' | 'recall' | 'building';

export default function NumberPegMemoriesScreen() {
  const { styles } = useStyles();
  const { t } = useTranslation('numberPeg');
  const router = useRouter();
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const memorySets = useMemorySets('number-peg');
  const dueReviews = useDueMemoryReviews();
  const [filter, setFilter] = useState<MemoryFilter>('all');
  const sets = useMemo(() => [...(memorySets.data ?? [])]
    .filter((set) => set.status !== 'archived')
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)), [memorySets.data]);
  const dueBySet = useMemo(() => {
    const counts = new Map<string, number>();
    for (const review of dueReviews.data ?? []) counts.set(review.memorySetId, (counts.get(review.memorySetId) ?? 0) + 1);
    return counts;
  }, [dueReviews.data]);
  const visibleSets = sets.filter((set) => filter === 'all' || (filter === 'building' ? set.status === 'draft' : set.status !== 'draft'));
  const refresh = () => { void Promise.allSettled([memorySets.refetch(), dueReviews.refetch()]); };

  return (
    <View style={styles.page}>
      <CommonHeader showAiCredits={false} title={t('memoryListTitle')} backAction={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={memorySets.isRefetching || dueReviews.isRefetching} onRefresh={refresh} />}>
        <Text style={styles.subtitle}>{t('memoryListSubtitle', { count: sets.length })}</Text>
        <LearningChoiceMenu value={filter} onChange={value => setFilter(value as MemoryFilter)} title={t('memoryListTitle')} options={[
          { value: 'all', label: t('filterAll') }, { value: 'recall', label: t('filterRecall') }, { value: 'building', label: t('filterBuilding') },
        ]} />
        {!isOffline && memorySets.isLoading ? (
          <View style={styles.loading}><LoadingView description={t('loading')} /></View>
        ) : canShowRequestErrors && memorySets.isError ? (
          <ModuleNoticeCard title={t('unavailable')} body={getNumberPegErrorMessage(memorySets.error, t('connection'))} onAction={() => void memorySets.refetch()} />
        ) : visibleSets.length ? (
          <View style={styles.list}>
            {visibleSets.map((memorySet) => (
              <NumberPegMemoryRow
                key={memorySet.id}
                memorySet={memorySet}
                dueCount={dueBySet.get(memorySet.id) ?? 0}
                onPress={() => router.push(`/number-peg/${memorySet.id}` as Href)}
              />
            ))}
          </View>
        ) : (
          <ModuleNoticeCard emoji="🎒" title={sets.length ? t('emptyFilter') : t('empty')} body={sets.length ? t('emptyFilterBody') : t('emptyBody')} />
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { gap: 13, paddingHorizontal: appSpacing.lg, paddingTop: appSpacing.sm, paddingBottom: 36 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize },
  filterRail: { flexDirection: 'row', gap: appSpacing.sm },
  filterChip: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.pill, borderWidth: 1.5, justifyContent: 'center', minHeight: 40, paddingHorizontal: 14 },
  filterChipSelected: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  filterText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  filterTextSelected: { color: theme.onAccent },
  list: { gap: 9 },
  loading: { height: 120, overflow: 'hidden' },
}));
