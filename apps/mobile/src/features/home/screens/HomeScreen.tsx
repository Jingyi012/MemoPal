import { usePageTour } from '@/features/onboarding/components/SpotlightTourProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { createThemedStyles } from '@/theme/createThemedStyles';
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
import { memopalThemes } from '@/theme/memopalTheme';
import { Href, useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Check, Circle, Plus } from '@/core/icons';
import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HomeHeader } from '../components/Header/HomeHeader';
import { TodayReviewCard } from '../components/TodayReviewCard';
import { UpcomingReviewCard } from '../components/UpcomingReviewCard';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useColorScheme } from 'nativewind';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export default function HomeScreen() {
  const { styles } = useStyles();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const replayTour = usePageTour('overview', authUser?.onboardingStatus === 'not-started');
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  useEffect(() => { if (tour === '1') { replayTour(); router.setParams({ tour: undefined }); } }, [tour, replayTour, router]);
  const { t } = useTranslation('home');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
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
  const onboardingMemory = user?.onboardingMemorySetId
    ? activeMemorySets.find((item) => item.id === user.onboardingMemorySetId)
    : undefined;
  const onboardingSteps = onboardingMemory ? {
    practiced: (user?.stats?.lessonsCompleted ?? 0) > 0,
    createdOwn: activeMemorySets.some((item) => item.id !== onboardingMemory.id),
    exploredPalace: activeMemorySets.some((item) => item.techniqueKey === 'palace'),
  } : null;

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
          displayName: t('guest'),
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

        {onboardingSteps && !Object.values(onboardingSteps).every(Boolean) ? (
          <GettingStartedCard
            steps={onboardingSteps}
            onNext={() => {
              if (!onboardingSteps.practiced) {
                router.push(`/number-peg/${onboardingMemory!.id}` as Href);
              } else if (!onboardingSteps.createdOwn) {
                router.push('/create-memory' as Href);
              } else {
                router.push('/palaces' as Href);
              }
            }}
          />
        ) : null}

        {!isOffline && memorySets.isLoading ? (
          <View style={styles.loadingFrame}><LoadingView description={t('loading')} /></View>
        ) : canShowRequestErrors && memorySets.isError ? (
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
            title={t('newMemory')}
            body={t('newMemoryBody')}
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
            <Text style={[styles.sectionLabel, { color: activeTheme.inkSoft }]}>{t('todaysPick')}</Text>
            <AnimatedPressable onPress={openTodayPick} style={styles.todayCard}>
              <LinearGradient colors={[activeTheme.sunTint, activeTheme.paper]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.todayGradient}>
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

        <Text style={[styles.sectionLabel, { color: activeTheme.inkSoft }]}>{t('thisWeek')}</Text>
        <View style={styles.statRow}>
          <StatTile value={`${practiceStatsQuery.data?.sessionsCompleted ?? 0}`} label={t('practiceSessions')} emoji="⚡" tone="sun" />
          <StatTile value={`${practiceStatsQuery.data?.wordsLearned ?? 0}`} label={t('words')} emoji="🌱" tone="mint" />
          <StatTile value={`${practiceStatsQuery.data?.firstAttemptRecallPercent ?? 0}%`} label={t('firstTryRecall')} emoji="🎯" tone="violet" />
        </View>

        <WeeklyActivityCard title={t('weekActivity')} activity={practiceStatsQuery.data?.weeklyActivity} events={activityQuery.events} />

        <MemoryTipCard />
      </ScrollView>
    </View>
  );
}

function GettingStartedCard({
  steps,
  onNext,
}: {
  steps: { practiced: boolean; createdOwn: boolean; exploredPalace: boolean };
  onNext: () => void;
}) {
  const { styles } = useStyles();
  const { t } = useTranslation('home');
  const rows = [
    { done: true, label: t('starterCreated') },
    { done: steps.practiced, label: t('starterPractice') },
    { done: steps.createdOwn, label: t('starterOwnMemory') },
    { done: steps.exploredPalace, label: t('starterPalace') },
  ];
  return (
    <View style={styles.gettingStartedCard}>
      <View style={styles.gettingStartedTop}>
        <View>
          <Text style={styles.gettingStartedEyebrow}>{t('gettingStarted')}</Text>
          <Text style={styles.gettingStartedTitle}>{t('gettingStartedTitle')}</Text>
        </View>
        <Text style={styles.gettingStartedCount}>{rows.filter((row) => row.done).length}/{rows.length}</Text>
      </View>
      <View style={styles.gettingStartedRows}>
        {rows.map((row) => (
          <View key={row.label} style={styles.gettingStartedRow}>
            {row.done
              ? <View style={styles.stepDone}><Check size={12} color="white" strokeWidth={3} /></View>
              : <Circle size={18} color="#C8C3D6" strokeWidth={2} />}
            <Text style={[styles.gettingStartedLabel, row.done && styles.gettingStartedLabelDone]}>{row.label}</Text>
          </View>
        ))}
      </View>
      <AnimatedPressable onPress={onNext} style={styles.gettingStartedAction}>
        <Text style={styles.gettingStartedActionText}>{t('continueGuide')}</Text>
        <ArrowRight size={16} color="#2B2A3D" strokeWidth={2.5} />
      </AnimatedPressable>
    </View>
  );
}

function openReview(router: ReturnType<typeof useRouter>, review: DueMemoryReview) {
  router.push({ pathname: '/memory-review/[memorySetId]', params: { memorySetId: review.memorySetId, scope: 'due' } });
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
  const { styles } = useStyles();
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
  const { styles } = useStyles();
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
  const { styles, theme } = useStyles();
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
      <ArrowRight size={18} color={theme.inkSoft} />
    </AnimatedPressable>
  );
}

function StatTile({ value, label, emoji, tone }: { value: string; label: string; emoji: string; tone: 'sun' | 'mint' | 'violet' }) {
  const { styles } = useStyles();
  const { colorScheme } = useColorScheme();
  const palette = memopalThemes[colorScheme ?? 'light'];
  return (
    <View style={[styles.statTile, { backgroundColor: palette[`${tone}Tint`], borderColor: palette[`${tone}Line`] }]}>
      <Text accessible={false} style={{ fontSize: 23, marginBottom: 6 }}>{emoji}</Text>
      <Text style={[styles.statValue, { color: palette.ink }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.inkSoft }]}>{label}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 128 },
  focusCard: { marginBottom: 22 },
  focusTopRow: { zIndex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  focusEyebrowRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  focusEyebrow: { color: theme.sun, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  focusReward: { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  focusStreak: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  focusStreakText: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 11.5 },
  focusTitle: { zIndex: 1, color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 28, marginTop: 18 },
  focusBody: { zIndex: 1, color: '#C9C5E0', fontFamily: typography.bodyBold, fontSize: 14, lineHeight: 21, marginTop: 6, maxWidth: '90%' },
  focusAction: { zIndex: 1, alignSelf: 'flex-start', minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: theme.sun, borderRadius: 13, paddingHorizontal: 15, marginTop: 14 },
  focusActionText: { color: theme.onSun, fontFamily: typography.displayExtraBold, fontSize: 14 },
  gettingStartedCard: { borderRadius: 19, borderWidth: 2, borderColor: theme.skyLine, backgroundColor: theme.skyTint, padding: 15, marginBottom: 16 },
  gettingStartedTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  gettingStartedEyebrow: { color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  gettingStartedTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 15, marginTop: 2 },
  gettingStartedCount: { color: theme.ink, backgroundColor: theme.paper, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontFamily: typography.bodyExtraBold, fontSize: 10.5 },
  gettingStartedRows: { gap: 8, marginTop: 13 },
  gettingStartedRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 9 },
  stepDone: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.grass },
  gettingStartedLabel: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 11.5 },
  gettingStartedLabelDone: { color: theme.inkMuted, textDecorationLine: 'line-through' },
  gettingStartedAction: { minHeight: 48, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 13, backgroundColor: theme.sun, paddingHorizontal: 14, marginTop: 13 },
  gettingStartedActionText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  emptyIconEmoji: { fontSize: 24 },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 18, padding: 13, boxShadow: '0px 8px 20px rgba(43,42,61,0.08)' },
  techniqueBadge: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  techniqueEmoji: { fontSize: 21, lineHeight: 25 },
  palaceBadge: { backgroundColor: theme.violetTint },
  pegBadge: { backgroundColor: theme.berryTint },
  continueBody: { flex: 1, minWidth: 0 },
  continueLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10.5 },
  continueTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 1, marginBottom: 6 },
  continueTrack: { height: 6, backgroundColor: theme.line, borderRadius: 999, overflow: 'hidden' },
  continueFill: { height: '100%', backgroundColor: theme.violet, borderRadius: 999 },
  continueMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 5 },
  sectionLabel: { color: theme.inkSoft, fontFamily: typography.displayExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  todayCard: { borderWidth: 2, borderColor: theme.sunLine, borderRadius: 18, overflow: 'hidden', boxShadow: '0px 8px 20px rgba(43,42,61,0.08)' },
  todayGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  todayIcon: { fontSize: 26 },
  todayBody: { flex: 1, minWidth: 0 },
  todayTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13.5 },
  todaySubtitle: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 2 },
  startButton: { backgroundColor: theme.sun, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9 },
  startButtonText: { color: theme.onSun, fontFamily: typography.displayExtraBold, fontSize: 12 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statTile: { flex: 1, alignItems: 'center', backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.line, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8 },
  statValue: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 },
  statLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, textAlign: 'center', marginTop: 2 },
  loadingFrame: { height: 145, borderRadius: 18, overflow: 'hidden' },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: theme.mintTint, borderWidth: 2, borderColor: theme.mintLine, borderRadius: 18, padding: 14, marginTop: 22 },
  tipEmoji: { fontSize: 24, lineHeight: 30 },
  tipCopy: { flex: 1 },
  tipEyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.8 },
  tipTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 2 },
  tipBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
}));
