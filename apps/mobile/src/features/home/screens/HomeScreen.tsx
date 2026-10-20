import { usePageTour } from '@/features/onboarding/components/SpotlightTourProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { HighlightCard } from '@/components/HighlightCard';
import { AppButton } from '@/components/ui/AppButton';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets/types/memorySet.types';
import { groupMemoryReviews, useDueMemoryReviews, usePracticeAttemptHistory, usePracticeStats, type DueMemoryReview, type PracticeAttempt } from '@/features/practice-attempts';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { WeekFootprintCard } from '@/features/gamification/shared';
import { useXpEvents } from '@/features/gamification/shared/hooks/useXpEvents';
import { useGamificationRules } from '@/features/gamification/shared/hooks/useGamificationRules';
import { typography } from '@/theme/typography';
import { Href, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Check, Circle, Plus, RefreshCw } from '@/core/icons';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { HomeHeader } from '../components/Header/HomeHeader';
import { TodayReviewCard } from '../components/TodayReviewCard';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { EducationAssignmentsList } from '@/features/education/components/EducationAssignmentsList';
import { EducationFamilyReportsShortcut } from '@/features/education/components/EducationFamilyReportsShortcut';
import { EducationClassroomInvitations } from '@/features/education/components/EducationClassroomInvitations';
import { EducationGuardianRequests } from '@/features/education/components/EducationGuardianRequests';
import { useMyEducationAssignments } from '@/features/education/hooks/useMyEducationAssignments';
import { useEducationClassroomInvitations, useEducationGuardianRequests } from '@/features/education/hooks/useEducationClassroomInvitations';

export default function HomeScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const replayTour = usePageTour('overview', authUser?.onboardingStatus === 'not-started');
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  useEffect(() => { if (tour === '1') { replayTour(); router.setParams({ tour: undefined }); } }, [tour, replayTour, router]);
  const { t } = useTranslation('home');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const { user } = useCurrentUser();
  const memorySets = useMemorySets();
  const dueReviews = useDueMemoryReviews();
  const activityQuery = useXpEvents({ recentDays: 7 });
  const practiceStatsQuery = usePracticeStats();
  const educationAssignmentsQuery = useMyEducationAssignments();
  const classroomInvitations = useEducationClassroomInvitations();
  const guardianRequests = useEducationGuardianRequests();
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
  const continueMemorySet = todayPickMemorySet ?? memorySet;
  const continueAttempt = continueMemorySet?.id === memorySet?.id ? latestAttempt : null;
  const streak = Math.max(0, user?.stats?.currentStreak ?? 0);
  const dueReviewGroups = groupMemoryReviews(dueReviews.data ?? []);
  const dueItemCount = dueReviewGroups.reduce((sum, group) => sum + group.itemCount, 0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [hadDueReviews, setHadDueReviews] = useState(false);
  useEffect(() => {
    if (dueItemCount > 0) setHadDueReviews(true);
  }, [dueItemCount]);
  const reviewsCompleted = hadDueReviews && dueItemCount === 0;
  const focusReview = dueReviewGroups[0]?.review;
  const focusReward = focusReview
    ? gamificationRules.data?.dueReviewXp ?? 10
    : !memorySet
      ? gamificationRules.data?.memoryLearnedXp ?? 20
      : memorySet.status === 'draft'
        ? null
        : gamificationRules.data?.extraPracticeXp ?? 5;
  const onboardingMemory = user?.onboardingMemorySetId
    ? activeMemorySets.find((item) => item.id === user.onboardingMemorySetId)
    : undefined;
  const onboardingSteps = onboardingMemory ? {
    practiced: (user?.stats?.lessonsCompleted ?? 0) > 0,
    createdOwn: activeMemorySets.some((item) => item.id !== onboardingMemory.id),
    exploredPalace: activeMemorySets.some((item) => item.techniqueKey === 'palace'),
  } : null;

  const refreshHome = async () => {
    await Promise.allSettled([memorySets.refetch(), activityQuery.refetch(), practiceStatsQuery.refetch(), dueReviews.refetch(), educationAssignmentsQuery.refetch(), classroomInvitations.memberships.refetch(), guardianRequests.guardianLinks.refetch()]);
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
        refreshControl={<RefreshControl refreshing={memorySets.isRefetching || activityQuery.isFetching || educationAssignmentsQuery.isRefetching} onRefresh={refreshHome} />}
        contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <SectionHeading
            title={t('todaysFocus')}
            trailing={focusReward ? <Text style={styles.sectionReward}>+{focusReward} {t('xpReward')}</Text> : null}
          />
          <DailyFocusCard
            dueCount={dueItemCount}
            reviewsCompleted={reviewsCompleted}
            memorySet={memorySet}
            review={focusReview}
            onPress={() => {
              if (focusReview) openReview(router, focusReview);
              else if (memorySet) router.push(`/memory-details/${memorySet.id}` as Href);
              else router.push('/create-memory' as Href);
            }}
          />
        </View>

        {onboardingSteps && !Object.values(onboardingSteps).every(Boolean) ? (
          <View style={styles.section}>
            <SectionHeading
              title={t('gettingStartedTitle')}
              trailing={<Text style={styles.gettingStartedCount}>{(onboardingSteps.practiced ? 2 : 1) + (onboardingSteps.createdOwn ? 1 : 0) + (onboardingSteps.exploredPalace ? 1 : 0)}/4</Text>}
            />
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
          </View>
        ) : null}

        {!isOffline && memorySets.isLoading ? (
          <View style={styles.loadingFrame}><LoadingView description={t('loading')} /></View>
        ) : canShowRequestErrors && memorySets.isError ? (
          <View style={styles.section}>
            <ModuleNoticeCard
              title={t('recentError')}
              body={t('retry')}
              onAction={memorySets.refetch}
            />
          </View>
        ) : continueMemorySet ? (
          <View style={styles.section}>
            <SectionHeading title={t('continuePractice')} />
            <ContinueSessionCardShim memorySet={continueMemorySet} latestAttempt={continueAttempt} onPress={() => router.push(`/memory-details/${continueMemorySet.id}`)} />
          </View>
        ) : (
          <View style={styles.section}>
            <ModuleNoticeCard
              icon={<Text style={styles.emptyIconEmoji}>✨</Text>}
              title={t('newMemory')}
              body={t('newMemoryBody')}
              actionLabel={t('tapToStart')}
              actionIcon={<Plus size={15} color={theme.onAccent} />}
              onAction={() => router.push('/create-memory' as Href)}
            />
          </View>
        )}

        {dueReviews.data?.length ? (
          <View style={styles.section}>
            <SectionHeading
              title={t('dueTodaySection')}
              trailing={dueReviewGroups.length > 2 ? (
                <AnimatedPressable accessibilityRole="button" onPress={() => setShowAllReviews((value) => !value)} style={styles.reviewToggle}>
                  <Text style={styles.reviewToggleText}>{showAllReviews ? t('collapseReviews') : t('showAllReviews').replace('{count}', String(dueItemCount))}</Text>
                </AnimatedPressable>
              ) : <Text style={styles.reviewCount}>{dueItemCount}</Text>}
            />
            <TodayReviewCard
              reviews={dueReviews.data}
              visibleCount={showAllReviews ? Number.MAX_SAFE_INTEGER : 2}
              onOpen={(review) => openReview(router, review)}
            />
          </View>
        ) : null}

        <EducationClassroomInvitations
          memberships={classroomInvitations.memberships.data ?? []}
          isLoading={classroomInvitations.memberships.isLoading}
          isError={classroomInvitations.memberships.isError}
          acceptingId={classroomInvitations.accept.isPending ? classroomInvitations.accept.variables : undefined}
          acceptError={classroomInvitations.accept.isError}
          decliningId={classroomInvitations.decline.isPending ? classroomInvitations.decline.variables : undefined}
          declineError={classroomInvitations.decline.isError}
          onAccept={(membershipId) => classroomInvitations.accept.mutate(membershipId)}
          onDecline={(membershipId) => classroomInvitations.decline.mutate(membershipId)}
          onRetry={() => { void classroomInvitations.memberships.refetch(); }}
        />
        <EducationGuardianRequests
          links={guardianRequests.guardianLinks.data ?? []}
          userId={authUser?.id ?? ''}
          isLoading={guardianRequests.guardianLinks.isLoading}
          isError={guardianRequests.guardianLinks.isError}
          confirmingId={guardianRequests.confirm.isPending ? guardianRequests.confirm.variables : undefined}
          confirmError={guardianRequests.confirm.isError}
          decliningId={guardianRequests.decline.isPending ? guardianRequests.decline.variables : undefined}
          declineError={guardianRequests.decline.isError}
          onConfirm={(linkId) => guardianRequests.confirm.mutate(linkId)}
          onDecline={(linkId) => guardianRequests.decline.mutate(linkId)}
          onRetry={() => { void guardianRequests.guardianLinks.refetch(); }}
        />
        <EducationAssignmentsList
          assignments={educationAssignmentsQuery.data ?? []}
          isLoading={educationAssignmentsQuery.isLoading}
          isError={educationAssignmentsQuery.isError}
          onRetry={() => { void educationAssignmentsQuery.refetch(); }}
          onOpen={(assignment) => router.push({
            pathname: '/education/assignments',
            params: { assignmentId: assignment.id },
          } as Href)}
        />
        <EducationFamilyReportsShortcut />

        <WeekFootprints activity={practiceStatsQuery.data?.weeklyActivity ?? []} streak={streak} />

        <View style={styles.section}>
          <SectionHeading title={t('memoryTip')} />
          <MemoryTipCard />
        </View>
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
      <AppButton
        label={t('continueGuide')}
        variant="secondary"
        size="compact"
        trailingIcon={ArrowRight}
        onPress={onNext}
        style={styles.gettingStartedAction}
      />
    </View>
  );
}

function SectionHeading({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  const { styles } = useStyles();
  return (
    <View style={styles.sectionHeadingRow}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {trailing}
    </View>
  );
}

function openReview(router: ReturnType<typeof useRouter>, review: DueMemoryReview) {
  router.push({ pathname: '/memory-review/[memorySetId]', params: { memorySetId: review.memorySetId, scope: 'due' } });
}

function DailyFocusCard({
  dueCount,
  reviewsCompleted,
  memorySet,
  review,
  onPress,
}: {
  dueCount: number;
  reviewsCompleted: boolean;
  memorySet?: MemorySet;
  review?: DueMemoryReview;
  onPress: () => void;
}) {
  const { styles, theme } = useStyles();
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
  return (
    <HighlightCard style={styles.focusCard}>
      <View style={styles.focusMain}>
        <View style={styles.focusCountRing}>
          <Svg width={82} height={82} viewBox="0 0 82 82" style={StyleSheet.absoluteFill}>
            <SvgCircle cx={41} cy={41} r={35} fill="none" stroke={theme.violetLine} strokeWidth={6} />
            <SvgCircle cx={41} cy={41} r={35} fill="none" stroke={reviewsCompleted ? theme.grass : theme.violetDeep} strokeWidth={6} strokeDasharray={`${2 * Math.PI * 35 * (dueCount ? 0.82 : 0.18)} ${2 * Math.PI * 35}`} strokeLinecap="round" rotation={-90} origin="41, 41" />
          </Svg>
          <View accessible={false} pointerEvents="none" style={styles.focusSparkle}>
            <Text style={styles.focusSparkleEmoji}>✨</Text>
          </View>
          <Text style={styles.focusCount}>{dueCount}</Text>
          <Text style={styles.focusCountLabel}>{t('itemsDue')}</Text>
        </View>
        <View style={styles.focusCopy}>
          <Text style={styles.focusTitle}>{reviewsCompleted ? t('allDoneTitle') : title}</Text>
          <Text style={styles.focusBody}>{reviewsCompleted ? t('allDoneBody') : body}</Text>
        </View>
      </View>
      {reviewsCompleted ? (
        <View style={[styles.focusAction, styles.focusActionComplete]}>
          <Text style={styles.focusActionCompleteText}>{t('allDoneTitle')}</Text>
          <Check size={17} color={theme.successText} strokeWidth={2.5} />
        </View>
      ) : (
        <AppButton
          label={action}
          variant="primary"
          size="large"
          fullWidth
          trailingIcon={ArrowRight}
          onPress={onPress}
          style={styles.focusAction}
        />
      )}
    </HighlightCard>
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
  const [tipIndex, setTipIndex] = useState((new Date().getDate() - 1) % MEMORY_TIPS.length + 1);
  const tip = MEMORY_TIPS[tipIndex - 1];
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipIcon}><Text style={styles.tipEmoji}>{tip.emoji}</Text></View>
      <View style={styles.tipCopy}>
        <View style={styles.tipHeader}>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('changeTip')} onPress={() => setTipIndex((current) => current % MEMORY_TIPS.length + 1)} style={styles.tipChange}>
            <RefreshCw size={13} color="#6042C8" />
            <Text style={styles.tipChangeText}>{t('changeTip')}</Text>
          </AnimatedPressable>
        </View>
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

function WeekFootprints({ activity, streak }: { activity: { date: string; sessions: number }[]; streak: number }) {
  const { t } = useTranslation('home');
  const nudge = streak > 0 && streak < 3
    ? t('streakNudge').replace('{count}', String(3 - streak))
    : streak >= 3 ? t('streakProtected') : t('streakStart');

  return (
    <WeekFootprintCard
      title={t('weekFootprints')}
      activity={activity}
      footerText={nudge}
    />
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { gap: 16, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 32 },
  section: { gap: 8 },
  focusCard: { marginBottom: 0 },
  focusMain: { zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  focusCountRing: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetTint },
  focusSparkle: { position: 'absolute', top: -3, right: -3, width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.sunLine, backgroundColor: theme.sunTint },
  focusSparkleEmoji: { fontSize: 12, lineHeight: 16 },
  focusCount: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 25, lineHeight: 28 },
  focusCountLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, marginTop: 1 },
  focusCopy: { flex: 1, minWidth: 0 },
  focusTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 },
  focusBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12.5, lineHeight: 18, marginTop: 5 },
  focusAction: { zIndex: 1, marginTop: 16 },
  focusActionComplete: { backgroundColor: theme.mintTint, borderColor: theme.mintLine, borderWidth: 1 },
  focusActionCompleteText: { color: theme.successText },
  gettingStartedCard: { borderRadius: 20, borderWidth: 1.5, borderColor: theme.skyLine, backgroundColor: theme.paper, padding: 15, boxShadow: '0px 4px 14px rgba(43,42,61,0.06)' },
  gettingStartedCount: { color: theme.ink, backgroundColor: theme.paper, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontFamily: typography.bodyExtraBold, fontSize: 10.5 },
  gettingStartedRows: { gap: 8 },
  gettingStartedRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 9 },
  stepDone: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.grass },
  gettingStartedLabel: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 11.5 },
  gettingStartedLabelDone: { color: theme.inkMuted, textDecorationLine: 'line-through' },
  gettingStartedAction: { alignSelf: 'flex-start', marginTop: 13 },
  emptyIconEmoji: { fontSize: 24 },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.violetLine, borderRadius: 20, padding: 13, boxShadow: '0px 5px 14px rgba(43,42,61,0.07)' },
  techniqueBadge: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  techniqueEmoji: { fontSize: 21, lineHeight: 25 },
  palaceBadge: { backgroundColor: theme.violetTint },
  pegBadge: { backgroundColor: theme.berryTint },
  continueBody: { flex: 1, minWidth: 0 },
  continueTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, marginBottom: 6 },
  continueTrack: { height: 6, backgroundColor: theme.line, borderRadius: 999, overflow: 'hidden' },
  continueFill: { height: '100%', backgroundColor: theme.violet, borderRadius: 999 },
  continueMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 5 },
  sectionHeadingRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionHeading: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 15 },
  sectionReward: { color: theme.violetDeep, backgroundColor: theme.violetTint, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontFamily: typography.bodyExtraBold, fontSize: 10.5 },
  reviewToggle: { borderRadius: 999, backgroundColor: theme.violetTint, paddingHorizontal: 9, paddingVertical: 5 },
  reviewToggleText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  reviewCount: { color: theme.violetDeep, backgroundColor: theme.violetTint, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontFamily: typography.bodyExtraBold, fontSize: 10.5 },
  loadingFrame: { height: 145, borderRadius: 18, overflow: 'hidden' },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.mintLine, borderRadius: 20, padding: 14, boxShadow: '0px 4px 14px rgba(43,42,61,0.06)' },
  tipIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.mintTint },
  tipEmoji: { fontSize: 22, lineHeight: 27 },
  tipCopy: { flex: 1 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tipChange: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, backgroundColor: theme.paper },
  tipChangeText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  tipTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 2 },
  tipBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
}));
