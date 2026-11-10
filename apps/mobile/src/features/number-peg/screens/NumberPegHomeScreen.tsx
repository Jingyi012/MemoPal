import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { NumberPegStoryHero } from '@/features/number-peg/components/NumberPegStoryHero';
import { NumberPegMemoryRow } from '@/features/number-peg/components/NumberPegMemoryRow';
import { useMemorySets } from '@/features/memory-sets';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useDueMemoryReviews } from '@/features/practice-attempts';
import Svg, { Circle } from 'react-native-svg';
import { localizeNumberPeg } from '@/features/number-peg/utils/localizedNumberPeg';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { useNumberPegOverview } from '@/features/number-peg/hooks/useNumberPegOverview';
import { getPegUnlockLevel, getUnlockedPegCount } from '@/features/number-peg/utils/numberPegMap';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, ChevronRight, Sparkles } from '@/core/icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useColorScheme } from 'nativewind';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export default function NumberPegHomeScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('numberPeg');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const { items } = useNumberPegOverview();
  const { user } = useCurrentUser();
  const memorySets = useMemorySets('number-peg');
  const dueReviews = useDueMemoryReviews();
  const currentLevel = Math.max(1, user?.level ?? 1);
  const unlockedCount = getUnlockedPegCount(currentLevel);
  const dueBySet = useMemo(() => {
    const counts = new Map<string, number>();
    for (const review of dueReviews.data ?? []) counts.set(review.memorySetId, (counts.get(review.memorySetId) ?? 0) + 1);
    return counts;
  }, [dueReviews.data]);
  const numberPegSets = useMemo(
    () => [...(memorySets.data ?? [])]
      .filter((set) => set.status !== 'archived')
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)),
    [memorySets.data]
  );
  const memorySetPreview = numberPegSets.slice(0, 3);
  const previewAnchors = items.slice(0, Math.min(5, unlockedCount));
  const extraUnlockedCount = Math.max(0, unlockedCount - previewAnchors.length);
  const nextGroupStart = Math.min(unlockedCount + 1, 100);
  const nextUnlockLevel = getPegUnlockLevel(nextGroupStart);
  const nextGroupEnd = (items.find((item) => item.number > nextGroupStart && getPegUnlockLevel(item.number) !== nextUnlockLevel)?.number ?? 101) - 1;

  return (
    <View style={styles.page}>
      <CommonHeader showAiCredits={false}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        backAction={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={memorySets.isRefetching || dueReviews.isRefetching} onRefresh={() => void Promise.allSettled([memorySets.refetch(), dueReviews.refetch()])} />}>
        <NumberPegStoryHero onStart={() => router.push('/number-peg/create' as Href)} />

        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionHeadingCopy}>
            <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{t('myPegMemories')}</Text>
          </View>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('viewAllMemories', { count: numberPegSets.length })} onPress={() => router.push('/number-peg/memories' as Href)} style={styles.viewAllButton}>
            <Text style={styles.viewAllButtonText}>{t('viewAllMemories', { count: numberPegSets.length })}</Text>
            <ChevronRight size={15} color={theme.violetDeep} />
          </AnimatedPressable>
        </View>

        {!isOffline && memorySets.isLoading ? (
          <View style={styles.loadingFrame}>
            <LoadingView description={t('loading')} />
          </View>
        ) : canShowRequestErrors && memorySets.isError ? (
          <ModuleNoticeCard
            title={t('unavailable')}
            body={getNumberPegErrorMessage(memorySets.error, t('connection'))}
            onAction={() => memorySets.refetch()}
          />
        ) : memorySetPreview.length ? (
          <View style={styles.memoryPreviewList}>
          {memorySetPreview.map((memorySet) => (
            <NumberPegMemoryRow
              key={memorySet.id}
              memorySet={memorySet}
              dueCount={dueBySet.get(memorySet.id) ?? 0}
              onPress={() => router.push(`/number-peg/${memorySet.id}` as Href)}
            />
          ))}
          </View>
        ) : (
          <ModuleNoticeCard
            emoji="🎒"
            title={numberPegSets.length ? t('emptyFilter') : t('empty')}
            body={numberPegSets.length ? t('emptyFilterBody') : t('emptyBody')}
            actionLabel={numberPegSets.length ? undefined : t('makeMemory')}
            actionIcon={numberPegSets.length ? undefined : <ArrowRight size={16} color={theme.onAccent} />}
            onAction={numberPegSets.length ? undefined : () => router.push('/number-peg/create' as Href)}
          />
        )}

        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionHeadingCopy}>
            <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{t('myAnchors')}</Text>
          </View>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('seeAllPegs')} onPress={() => router.push('/number-peg/map' as Href)} style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>{t('seeAll')}</Text>
            <ChevronRight size={15} color={theme.violetDeep} />
          </AnimatedPressable>
        </View>

        <View style={styles.anchorCard}>
          <View style={styles.anchorSummary}>
            <View style={styles.ringWrap}>
              <Svg width={68} height={68} viewBox="0 0 68 68">
                <Circle cx={34} cy={34} r={28} fill="none" stroke={theme.violetTint} strokeWidth={6} />
                <Circle cx={34} cy={34} r={28} fill="none" stroke={theme.violetDeep} strokeWidth={6} strokeDasharray={`${2 * Math.PI * 28 * (unlockedCount / 100)} ${2 * Math.PI * 28}`} strokeLinecap="round" rotation={-90} origin="34, 34" />
              </Svg>
              <Text style={styles.ringLabel}>{unlockedCount}%</Text>
            </View>
            <View style={styles.anchorSummaryCopy}>
              <Text style={styles.anchorSummaryTitle}>{t('anchorsUnlocked', { count: unlockedCount, total: 100 })}</Text>
              <Text style={styles.anchorSummaryBody}>{unlockedCount < 100
                ? t('nextAnchorGroup', { start: nextGroupStart, end: nextGroupEnd, level: Math.ceil(nextGroupStart / 10) })
                : t('allAnchorsUnlocked')}</Text>
            </View>
          </View>
          <View style={styles.anchorGrid}>
            {previewAnchors.map((item) => {
              const localizedItem = localizeNumberPeg(item, t);
              return (
                <View key={item.id} style={styles.anchorTile}>
                  <Text style={styles.anchorNumber}>{item.number}</Text>
                  <Text style={styles.anchorEmoji}>{item.image}</Text>
                  <Text numberOfLines={1} style={styles.anchorName}>{localizedItem.keyword}</Text>
                </View>
              );
            })}
            {extraUnlockedCount > 0 ? (
              <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/number-peg/map' as Href)} style={styles.moreAnchorsTile}>
                <Text style={styles.moreAnchorsCount}>+{extraUnlockedCount}</Text>
                <Text style={styles.moreAnchorsLabel}>{t('moreUnlocked')}</Text>
              </AnimatedPressable>
            ) : null}
          </View>
          <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/number-peg/familiarity' as Href)} style={styles.practiceAnchorsButton}>
            <Sparkles size={16} color={theme.violetDeep} />
            <Text style={styles.practiceAnchorsText}>{t('practiceAnchors')}</Text>
            <ArrowRight size={16} color={theme.violetDeep} />
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 44 },
  heroEmoji: { fontSize: 27 },
  sectionHeadingRow: {
    marginTop: 17,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionEyebrow: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12, letterSpacing: 1.1 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19, marginTop: 3 },
  sectionHeadingCopy: { flex: 1, paddingRight: 10 },
  seeAllButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 1, borderRadius: 999, backgroundColor: theme.violetTint, borderWidth: 1, borderColor: theme.violetLine, paddingLeft: 11, paddingRight: 7 },
  seeAllText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  viewAllButton: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 1, minHeight: 40, paddingLeft: 11, paddingRight: 7 },
  viewAllButtonText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  memoryPreviewList: { gap: 8 },
  anchorCard: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 22, borderWidth: 1.5, gap: 14, padding: 15, shadowColor: theme.ink, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  anchorSummary: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  ringWrap: { alignItems: 'center', height: 68, justifyContent: 'center', width: 68 },
  ringLabel: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 13, position: 'absolute' },
  anchorSummaryCopy: { flex: 1, gap: 3 },
  anchorSummaryTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14 },
  anchorSummaryBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 15 },
  anchorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  anchorTile: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 14, flexBasis: '31%', flexGrow: 1, gap: 2, minHeight: 77, paddingHorizontal: 5, paddingVertical: 7, position: 'relative' },
  anchorNumber: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12, left: 7, position: 'absolute', top: 5 },
  anchorEmoji: { fontSize: 25, lineHeight: 30, marginTop: 3 },
  anchorName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 9.5, maxWidth: '100%' },
  moreAnchorsTile: { alignItems: 'center', backgroundColor: theme.canvas, borderColor: theme.violetLine, borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, flexBasis: '31%', flexGrow: 1, justifyContent: 'center', minHeight: 77, paddingHorizontal: 5 },
  moreAnchorsCount: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 17 },
  moreAnchorsLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  practiceAnchorsButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 46, paddingHorizontal: 12 },
  practiceAnchorsText: { color: theme.violetDeep, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 11.5, textAlign: 'center' },
  loadingFrame: { height: 150, overflow: 'hidden', borderRadius: 20 },
}));
