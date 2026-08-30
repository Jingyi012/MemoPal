import AnimatedPressable from '@/components/AnimatedPressable';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { NightEmphasisCard } from '@/components/NightEmphasisCard';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets/types/memorySet.types';
import { groupMemoryReviews, useDueMemoryReviews, usePracticeAttemptHistory, usePracticeStats, useUpcomingMemoryReviews, type DueMemoryReview, type PracticeAttempt } from '@/features/practice-attempts';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useXpEvents } from '@/features/gamification/shared/hooks/useXpEvents';
import { useGamificationRules } from '@/features/gamification/shared/hooks/useGamificationRules';
import { WeeklyActivityCard } from '@/features/gamification/shared/components/WeeklyActivityCard';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Plus } from 'lucide-react-native';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HomeHeader } from '../components/Header/HomeHeader';
import { TodayReviewCard } from '../components/TodayReviewCard';
import { UpcomingReviewCard } from '../components/UpcomingReviewCard';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const { user } = useCurrentUser();
  const memorySets = useMemorySets();
  const dueReviews = useDueMemoryReviews();
  const upcomingReviews = useUpcomingMemoryReviews(30);
  const activityQuery = useXpEvents({ recentDays: 7 });
  const practiceStatsQuery = usePracticeStats();
  const gamificationRules = useGamificationRules();
  const activeMemorySets = (memorySets.data ?? [])
    .filter((item) => item.status !== 'archived')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const memorySet = activeMemorySets[0];
  const latestAttemptQuery = usePracticeAttemptHistory(memorySet?.id ?? '');
  const latestAttempt = latestAttemptQuery.data?.[0] ?? null;
  const todayPickMemorySet = activeMemorySets.length > 1
    ? activeMemorySets[activeMemorySets.length - 1]
    : undefined;
  const streak = Math.max(0, user?.stats?.currentStreak ?? 0);
  const dueReviewGroups = groupMemoryReviews(dueReviews.data ?? []);
  const focusReview = dueReviewGroups[0]?.review;

  const refreshHome = async () => {
    await Promise.allSettled([memorySets.refetch(), activityQuery.refetch(), practiceStatsQuery.refetch(), dueReviews.refetch(), upcomingReviews.refetch()]);
  };

  const openTodayPick = () => {
    if (todayPickMemorySet) router.push(`/memory-details/${todayPickMemorySet.id}` as Href);
  };

  return (
    <View style={styles.page}>
      <HomeHeader
        userData={user ?? {
          id: 'guest',
          displayName: 'Guest',
          email: 'guest@local',
          totalXp: 0,
          level: 1,
          isPremium: false,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={memorySets.isRefetching || activityQuery.isFetching} onRefresh={refreshHome} />}
        contentContainerStyle={styles.content}>
        <DailyFocusCard
          dueCount={dueReviewGroups.length}
          memorySet={memorySet}
          review={focusReview}
          memoryLearnedXp={gamificationRules.data?.memoryLearnedXp ?? 20}
          dueReviewXp={gamificationRules.data?.dueReviewXp ?? 10}
          extraPracticeXp={gamificationRules.data?.extraPracticeXp ?? 5}
          streak={streak}
          onPress={() => {
            if (focusReview) openReview(router, focusReview);
            else if (memorySet) router.push(`/memory-details/${memorySet.id}` as Href);
            else router.push('/create-memory' as Href);
          }}
        />

        {memorySets.isLoading ? (
          <View style={styles.loadingFrame}><LoadingView description={t('loading')} /></View>
        ) : memorySets.isError ? (
          <ModuleNoticeCard
            title={t('recentError')}
            body={t('retry')}
            onAction={memorySets.refetch}
          />
        ) : memorySet ? (
          <ContinueSessionCardShim memorySet={memorySet} latestAttempt={latestAttempt} onPress={() => router.push(`/memory-details/${memorySet.id}`)} />
        ) : (
          <ModuleNoticeCard
            icon={<Text style={styles.emptyIconEmoji}>✨</Text>}
            title={t('newSession')}
            body={t('newSessionBody')}
            actionLabel={t('tapToStart')}
            actionIcon={<Plus size={15} color="#2B2A3D" />}
            onAction={() => router.push('/create-memory' as Href)}
          />
        )}

        {dueReviews.data?.length ? (
          <TodayReviewCard
            reviews={dueReviews.data}
            onOpen={(review) => openReview(router, review)}
            onStartReview={(review) => openReview(router, review)}
          />
        ) : null}

        {upcomingReviews.data?.length ? (
          <UpcomingReviewCard reviews={upcomingReviews.data} onOpen={(review) => openReview(router, review)} />
        ) : null}

        {todayPickMemorySet ? (
          <>
            <Text style={styles.sectionLabel}>{t('todaysPick')}</Text>
            <AnimatedPressable onPress={openTodayPick} style={styles.todayCard}>
              <LinearGradient colors={['#FFF7E0', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.todayGradient}>
                <Text style={styles.todayIcon}>🕯️</Text>
                <View style={styles.todayBody}>
                  <Text numberOfLines={1} style={styles.todayTitle}>{todayPickMemorySet.title}</Text>
                  <Text style={styles.todaySubtitle}>
                    {todayPickMemorySet.status === 'draft' ? t('todaySubtitleDraft') : t('todaySubtitleExisting')}
                  </Text>
                </View>
                <View style={styles.startButton}>
                  <Text style={styles.startButtonText}>{t('todayActionExisting')}</Text>
                </View>
              </LinearGradient>
            </AnimatedPressable>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>{t('thisWeek')}</Text>
        <View style={styles.statRow}>
          <StatTile value={`${practiceStatsQuery.data?.sessionsCompleted ?? 0}`} label={t('sessions')} />
          <StatTile value={`${practiceStatsQuery.data?.wordsLearned ?? 0}`} label={t('words')} />
          <StatTile value={`${practiceStatsQuery.data?.firstAttemptRecallPercent ?? 0}%`} label={t('firstTryRecall')} />
        </View>

        <WeeklyActivityCard title={t('weekActivity')} activity={practiceStatsQuery.data?.weeklyActivity} events={activityQuery.events} />

        <MemoryTipCard />
      </ScrollView>
    </View>
  );
}

function openReview(router: ReturnType<typeof useRouter>, review: DueMemoryReview) {
  const route = review.techniqueKey === 'palace'
    ? `/palaces/memory/${review.memorySetId}?mode=recall`
    : `/number-peg/${review.memorySetId}?mode=recall`;
  router.push(route as Href);
}

function DailyFocusCard({
  dueCount,
  memorySet,
  review,
  memoryLearnedXp,
  dueReviewXp,
  extraPracticeXp,
  streak,
  onPress,
}: {
  dueCount: number;
  memorySet?: MemorySet;
  review?: DueMemoryReview;
  memoryLearnedXp: number;
  dueReviewXp: number;
  extraPracticeXp: number;
  streak: number;
  onPress: () => void;
}) {
  const { t } = useTranslation('home');
  const isDraft = memorySet?.status === 'draft';
  const title = review
    ? `${dueCount} ${t(dueCount === 1 ? 'reviewsWaiting' : 'reviewsWaitingPlural')}`
    : !memorySet
      ? t('focusFirstMemory')
      : isDraft
        ? t('focusContinueBuild')
        : t('focusCaughtUp');
  const body = review
    ? t('focusReviewBody')
    : !memorySet
      ? t('focusFirstMemoryBody')
      : isDraft
        ? t('focusContinueBuildBody')
        : t('focusCaughtUpBody');
  const action = review
    ? t('startReview')
    : !memorySet
      ? t('startLearning')
      : isDraft
        ? t('continueBuilding')
        : t('extraPractice');
  const reward = review ? dueReviewXp : !memorySet ? memoryLearnedXp : isDraft ? null : extraPracticeXp;

  return (
    <NightEmphasisCard style={styles.focusCard}>
      <View style={styles.focusTopRow}>
        <View style={styles.focusEyebrowRow}>
          <Text style={styles.focusEyebrow}>{t('todaysFocus')}</Text>
          {reward ? <Text style={styles.focusReward}>+{reward} {t('xpReward')}</Text> : null}
        </View>
        <View style={styles.focusStreak}><Text style={styles.focusStreakText}>🔥 {streak}</Text></View>
      </View>
      <Text style={styles.focusTitle}>{title}</Text>
      <Text style={styles.focusBody}>{body}</Text>
      <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.focusAction}>
        <Text style={styles.focusActionText}>{action}</Text>
        <ArrowRight size={17} color="#2B2A3D" strokeWidth={2.5} />
      </AnimatedPressable>
    </NightEmphasisCard>
  );
}

const MEMORY_TIPS = [
  { title: 'Make it bizarre', body: 'Strange, oversized images are easier to recall than ordinary ones.', emoji: '🎨' },
  { title: 'Use every sense', body: 'Add a sound, texture, or smell to make your memory scene vivid.', emoji: '✨' },
  { title: 'Keep the route steady', body: 'Use the same order every time you walk through a Memory Palace.', emoji: '🚶' },
  { title: 'Review before you forget', body: 'A quick recall today makes the next review much easier.', emoji: '🔁' },
];

function MemoryTipCard() {
  const { t } = useTranslation('home');
  const tip = MEMORY_TIPS[(new Date().getDate() - 1) % MEMORY_TIPS.length];
  const tipIndex = (new Date().getDate() - 1) % MEMORY_TIPS.length + 1;
  return (
    <View style={styles.tipCard}>
      <Text style={styles.tipEmoji}>{tip.emoji}</Text>
      <View style={styles.tipCopy}>
      <Text style={styles.tipEyebrow}>{t('memoryTip')}</Text>
        <Text style={styles.tipTitle}>{t(`tip${tipIndex}Title` as 'tip1Title')}</Text>
        <Text style={styles.tipBody}>{t(`tip${tipIndex}Body` as 'tip1Body')}</Text>
      </View>
    </View>
  );
}

function ContinueSessionCardShim({ memorySet, latestAttempt, onPress }: { memorySet: MemorySet; latestAttempt: PracticeAttempt | null; onPress: () => void }) {
  const { t } = useTranslation('home');
  const isPalace = memorySet.techniqueKey === 'palace';
  const recalledCount = latestAttempt?.mode === 'recall'
    ? Math.min(memorySet.items.length, Math.max(0, latestAttempt.correctCount))
    : 0;
  const progress = memorySet.status === 'draft'
    ? 25
    : memorySet.items.length
      ? (recalledCount / memorySet.items.length) * 100
      : 0;

  return (
    <AnimatedPressable onPress={onPress} style={styles.continueCard}>
      <View style={[styles.techniqueBadge, isPalace ? styles.palaceBadge : styles.pegBadge]}>
        <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
      </View>
      <View style={styles.continueBody}>
        <Text style={styles.continueLabel}>{t('continue')}</Text>
        <Text numberOfLines={1} style={styles.continueTitle}>{memorySet.title}</Text>
        <View style={styles.continueTrack}><View style={[styles.continueFill, { width: `${progress}%` }]} /></View>
        <Text style={styles.continueMeta}>
          {memorySet.status === 'draft'
            ? t('keepBuilding')
            : latestAttempt?.mode === 'recall'
              ? `${recalledCount}/${memorySet.items.length} ${t('itemsRecalled')}`
              : `${memorySet.items.length} ${t('itemsReady')}`}
        </Text>
      </View>
      <ArrowRight size={18} color="#6B6A80" />
    </AnimatedPressable>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 128 },
  focusCard: { marginBottom: 16 },
  focusTopRow: { zIndex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  focusEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  focusEyebrow: { color: '#FFC93C', fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  focusReward: { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  focusStreak: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  focusStreakText: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 11.5 },
  focusTitle: { zIndex: 1, color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 20, marginTop: 12 },
  focusBody: { zIndex: 1, color: '#C9C5E0', fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 17, marginTop: 4, maxWidth: '88%' },
  focusAction: { zIndex: 1, alignSelf: 'flex-start', minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFC93C', borderRadius: 13, paddingHorizontal: 15, marginTop: 14 },
  focusActionText: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 12.5 },
  emptyIconEmoji: { fontSize: 24 },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 18, padding: 13, boxShadow: '0px 8px 20px rgba(43,42,61,0.08)' },
  techniqueBadge: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  techniqueEmoji: { fontSize: 21, lineHeight: 25 },
  palaceBadge: { backgroundColor: '#EEE9FF' },
  pegBadge: { backgroundColor: '#FFF0F4' },
  continueBody: { flex: 1, minWidth: 0 },
  continueLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10.5 },
  continueTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 1, marginBottom: 6 },
  continueTrack: { height: 6, backgroundColor: '#EEE9DC', borderRadius: 999, overflow: 'hidden' },
  continueFill: { height: '100%', backgroundColor: '#9B8CFF', borderRadius: 999 },
  continueMeta: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 5 },
  sectionLabel: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  todayCard: { borderWidth: 2, borderColor: '#FFE6A3', borderRadius: 18, overflow: 'hidden', boxShadow: '0px 8px 20px rgba(43,42,61,0.08)' },
  todayGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  todayIcon: { fontSize: 26 },
  todayBody: { flex: 1, minWidth: 0 },
  todayTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 13.5 },
  todaySubtitle: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11, marginTop: 2 },
  startButton: { backgroundColor: '#FFC93C', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9 },
  startButtonText: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 12 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statTile: { flex: 1, alignItems: 'center', backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8 },
  statValue: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 19 },
  statLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 2 },
  loadingFrame: { height: 145, borderRadius: 18, overflow: 'hidden' },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F7F5FF', borderWidth: 2, borderColor: '#E0D9FF', borderRadius: 18, padding: 14, marginTop: 22 },
  tipEmoji: { fontSize: 24, lineHeight: 30 },
  tipCopy: { flex: 1 },
  tipEyebrow: { color: '#7A68E0', fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.8 },
  tipTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 2 },
  tipBody: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
});
