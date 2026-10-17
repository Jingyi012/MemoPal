import { useAuth } from '@/contexts/AuthProvider';
import { SpotlightTarget, usePageTour } from '@/features/onboarding/components/SpotlightTourProvider';
import { practiceCreateHref } from '@/features/onboarding/utils/onboardingRoutes';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { MemorySetCard } from '@/components/MemorySetCard';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { NewMemoryCard } from '@/components/NewMemoryCard';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useEnabledMemoryModules } from '@/core/memory';
import { LevelProgressHeader } from '@/features/gamification/achievements/components/LevelProgressHeader';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { useDueMemoryReviews, useUpcomingMemoryReviews } from '@/features/practice-attempts';
import type { DueMemoryReview } from '@/features/practice-attempts';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, BookOpen, CircleHelp, RefreshCcw } from '@/core/icons';
import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PracticeScreen() {
  const { styles, theme } = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scroll = useRef<ScrollView>(null);
  const { user: authUser } = useAuth();
  const { t: tourT } = useTranslation('onboarding');
  const openMemoryFlow = (requestedGuide: boolean) => {
    if (!requestedGuide) {
      router.push('/create-memory' as Href);
      return;
    }
    router.push(practiceCreateHref(
      authUser?.onboardingStatus,
      authUser?.onboardingMemorySetId,
      true,
    ) as Href);
  };
  const createMemory = () => openMemoryFlow(false);
  const replayTour = usePageTour('practicePage', authUser?.onboardingStatus === 'not-started');
  const revealTop = () => scroll.current?.scrollTo({ y: 0, animated: false });
  const { t } = useTranslation('practice');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const modules = useEnabledMemoryModules();
  const memorySets = useMemorySets();
  const dueReviews = useDueMemoryReviews();
  const upcomingReviews = useUpcomingMemoryReviews(30);
  const { user } = useCurrentUser();
  const totalXp = Math.max(0, user?.totalXp ?? 0);
  const { levelInfo } = useLevelByXp(totalXp, user?.level);
  const practiceLevel = {
    currentLevel: Math.max(1, levelInfo?.currentLevel ?? user?.level ?? 1),
    xpInCurrentLevel: Math.max(0, levelInfo?.xpInCurrentLevel ?? totalXp),
    xpToNextLevel: Math.max(0, levelInfo?.xpToNextLevel ?? 0),
    totalXp,
    title: levelInfo?.currentLevelConfig?.title ?? 'Memory Explorer',
    titleZh: levelInfo?.currentLevelConfig?.titleZh,
  };
  const recentSet = useMemo(
    () => (memorySets.data ?? []).find((memorySet) => memorySet.status !== 'archived'),
    [memorySets.data]
  );
  const reviewByMemorySetId = useMemo(() => {
    const nextReviewBySet = new Map<string, DueMemoryReview>();
    [...(dueReviews.data ?? []), ...(upcomingReviews.data ?? [])].forEach((review) => {
      const current = nextReviewBySet.get(review.memorySetId);
      if (!current || Date.parse(review.dueAt) < Date.parse(current.dueAt)) {
        nextReviewBySet.set(review.memorySetId, review);
      }
    });
    return nextReviewBySet;
  }, [dueReviews.data, upcomingReviews.data]);

  return (
    <View style={styles.page}>
      <CommonHeader eyebrow={t('eyebrow')} title={t('title')} description={t('description')} actions={[{ icon: CircleHelp, onPress: replayTour, accessibilityLabel: tourT('guideEntry') }]} hideBackButton />

      <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressSection}>
          <Text style={[styles.sectionLabel, styles.flushHeading, { color: activeTheme.ink }]}>{t('yourProgress')}</Text>
          <LevelProgressHeader level={practiceLevel} streak={user?.stats?.currentStreak ?? 0} />
        </View>

        <SpotlightTarget id="practiceCreate" onReveal={revealTop} onActivate={() => openMemoryFlow(true)}>
        <NewMemoryCard
          title={t('newMemory')}
          body={t('newMemoryBody')}
          onPress={createMemory}
        />
        </SpotlightTarget>

        <Text style={[styles.sectionLabel, styles.techniqueHeading, { color: activeTheme.ink }]}>
          {t('jumpTechnique')}
        </Text>
        <View style={styles.techniqueRow}>
          {modules.map((module) => {
            const isPeg = module.key === 'number-peg';
            return (
              <View key={module.key} style={styles.techniqueCardWrap}>
                <AnimatedPressable
                  accessibilityRole="button"
                  accessibilityLabel={isPeg ? t('numberPeg') : t('palace')}
                  onPress={() => router.push(module.route as Href)}
                  style={[
                    styles.techniqueCard,
                    {
                      backgroundColor: isPeg ? activeTheme.berryTint : activeTheme.violetTint,
                      borderColor: isPeg ? activeTheme.berryLine : activeTheme.violetLine,
                    },
                  ]}>
                  <View style={[styles.techniqueGlow, { backgroundColor: isPeg ? activeTheme.berryLine : activeTheme.violetLine }]} />
                  <View style={[styles.techniqueOrbit, { borderColor: isPeg ? activeTheme.berryLine : activeTheme.violetLine }]} />
                  <View style={[styles.techniqueIconPlate, { backgroundColor: activeTheme.paper }]}>
                    <Text style={styles.techniqueEmoji}>{isPeg ? '🕯️' : '🏰'}</Text>
                  </View>
                  <View style={styles.techniqueTextBlock}>
                    <Text style={[styles.techniqueKicker, { color: isPeg ? activeTheme.berryDeep : activeTheme.violetDeep }]}>
                      {isPeg ? t('numberPegKicker') : t('palaceKicker')}
                    </Text>
                    <Text numberOfLines={1} style={[styles.techniqueName, { color: activeTheme.ink }]}>
                      {isPeg ? t('numberPeg') : t('palace')}
                    </Text>
                  </View>
                  <View style={[styles.techniqueAction, { backgroundColor: isPeg ? activeTheme.berryDeep : activeTheme.violetDeep }]}>
                    <Text style={[styles.techniqueLink, { color: activeTheme.onAccent }]}>{t('tapToStart')}</Text>
                    <ArrowRight size={14} color={activeTheme.onAccent} />
                  </View>
                </AnimatedPressable>
              </View>
            );
          })}
        </View>


        {(!isOffline && memorySets.isLoading) || (canShowRequestErrors && memorySets.isError) || recentSet ? (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionLabel, styles.flushHeading, { color: activeTheme.ink }]}>{t('recentPractice')}</Text>
              <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/(tabs)/library' as Href)} style={styles.seeAllButton}>
                <Text style={styles.seeAll}>{t('seeAll')} →</Text>
              </AnimatedPressable>
            </View>
            {!isOffline && memorySets.isLoading ? (
              <View style={styles.emptyCard}><Text style={styles.emptyBody}>{t('recentPractice')}</Text></View>
            ) : canShowRequestErrors && memorySets.isError ? (
              <ModuleNoticeCard
                icon={<RefreshCcw size={22} color={theme.inkSoft} />}
                title={t('recentPractice')}
                body={t('description')}
                actionLabel={t('tryAgain')}
                onAction={() => memorySets.refetch()}
              />
            ) : recentSet ? (
              <MemorySetCard
                memorySet={recentSet}
                reviewAt={reviewByMemorySetId.get(recentSet.id)?.dueAt}
                actionLabel={t('practiceNow')}
                onOpen={() => openMemorySet(router, recentSet)}
                variant="list"
              />
            ) : null}
          </View>
        ) : null}

      </ScrollView>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={t('allLessons')}
        accessibilityHint={t('allLessonsBody')}
        onPress={() => router.push('/lessons' as Href)}
        style={[styles.lessonFab, { bottom: Math.max(16, insets.bottom + 10), backgroundColor: activeTheme.violetDeep }]}>
        <BookOpen size={23} color={activeTheme.onAccent} />
        <View style={[styles.lessonFabDot, { backgroundColor: activeTheme.sun }]} />
      </AnimatedPressable>
    </View>
  );
}

function openMemorySet(router: ReturnType<typeof useRouter>, memorySet: MemorySet) {
  router.push(`/memory-details/${memorySet.id}` as Href);
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 112 },
  sectionLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase' },
  techniqueHeading: { marginTop: 18, marginBottom: 10 },
  techniqueRow: { flexDirection: 'row', gap: 10, width: '100%' },
  techniqueCardWrap: { flex: 1, minWidth: 0 },
  techniqueCard: { borderRadius: 24, borderWidth: 1.5, minHeight: 176, overflow: 'hidden', paddingHorizontal: 15, paddingVertical: 15, width: '100%', justifyContent: 'space-between' },
  techniqueGlow: { borderRadius: 80, height: 150, opacity: 0.3, position: 'absolute', right: -62, top: -61, width: 150 },
  techniqueOrbit: { borderRadius: 65, borderWidth: 1.5, height: 130, opacity: 0.7, position: 'absolute', right: -48, top: -50, width: 130 },
  techniqueIconPlate: { alignItems: 'center', borderRadius: 18, height: 58, justifyContent: 'center', width: 58, shadowColor: theme.ink, shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  techniqueEmoji: { fontSize: 32, lineHeight: 38 },
  techniqueTextBlock: { gap: 3, marginTop: 10 },
  techniqueKicker: { fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 1 },
  techniqueName: { fontFamily: typography.displayExtraBold, fontSize: 15 },
  techniqueAction: { alignItems: 'center', borderRadius: 999, flexDirection: 'row', gap: 4, justifyContent: 'center', minHeight: 36, paddingHorizontal: 10 },
  techniqueLink: { fontFamily: typography.bodyExtraBold, fontSize: 11 },
  recentSection: { marginTop: 24 },
  sectionHeadingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  flushHeading: { marginBottom: 10 },
  seeAllButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 6 },
  seeAll: { color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: 11.5 },
  progressSection: { marginBottom: 2 },
  lessonFab: { alignItems: 'center', borderRadius: 30, bottom: 16, elevation: 5, height: 58, justifyContent: 'center', position: 'absolute', right: 20, shadowColor: theme.ink, shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, width: 58 },
  lessonFabDot: { borderColor: theme.paper, borderRadius: 5, borderWidth: 2, height: 10, position: 'absolute', right: 9, top: 8, width: 10 },
  emptyCard: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 2, padding: 20 },
  emptyBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
}));
