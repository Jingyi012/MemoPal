import { useAuth } from '@/contexts/AuthProvider';
import { SpotlightTarget, usePageTour } from '@/features/onboarding/components/SpotlightTourProvider';
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
import { BookOpen, ChevronRight, CircleHelp, RefreshCcw } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';

export default function PracticeScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const scroll = useRef<ScrollView>(null);
  const { user: authUser } = useAuth();
  const { t: tourT } = useTranslation('onboarding');
  const [guidedEntry, setGuidedEntry] = useState(false);
  const createMemory = () => {
    const needsGuide = guidedEntry || authUser?.onboardingStatus === 'not-started' || authUser?.onboardingStatus === 'in-progress';
    setGuidedEntry(false);
    router.push((needsGuide ? authUser?.onboardingMemorySetId
      ? `/(tabs)/library?guidedMemory=${authUser.onboardingMemorySetId}`
      : '/onboarding?replay=true' : '/create-memory') as Href);
  };
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
      <CommonHeader eyebrow={t('eyebrow')} title={t('title')} description={t('description')} actions={[{ icon: CircleHelp, onPress: () => { setGuidedEntry(true); replayTour(); }, accessibilityLabel: tourT('guideEntry') }]} hideBackButton />

      <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressSection}>
          <Text style={[styles.sectionLabel, styles.flushHeading, { color: activeTheme.ink }]}>{t('yourProgress')}</Text>
          <LevelProgressHeader level={practiceLevel} streak={user?.stats?.currentStreak ?? 0} />
        </View>

        <SpotlightTarget id="practiceCreate" onReveal={revealTop} onActivate={createMemory}>
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
                  <Text style={styles.techniqueEmoji}>{isPeg ? '🕯️' : '🏰'}</Text>
                  <Text numberOfLines={1} style={[styles.techniqueName, { color: activeTheme.ink }]}>
                    {isPeg ? t('numberPeg') : t('palace')}
                  </Text>
                  <Text style={[styles.techniqueLink, { color: isPeg ? activeTheme.berryDeep : activeTheme.violetDeep }]}>
                    {t('tapToStart')} →
                  </Text>
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

        <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('allLessons')} onPress={() => router.push('/lessons' as Href)} style={styles.lessonCard}>
          <View style={styles.lessonIcon}><BookOpen size={22} color={activeTheme.violetDeep} /></View>
          <View style={styles.lessonCopy}>
            <Text style={styles.lessonTitle}>{t('allLessons')}</Text>
            <Text style={styles.lessonBody}>{t('allLessonsBody')}</Text>
          </View>
          <ChevronRight size={20} color={activeTheme.violetDeep} />
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

function openMemorySet(router: ReturnType<typeof useRouter>, memorySet: MemorySet) {
  router.push(`/memory-details/${memorySet.id}` as Href);
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 42 },
  sectionLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase' },
  techniqueHeading: { marginTop: 18, marginBottom: 10 },
  techniqueRow: { flexDirection: 'row', gap: 10, width: '100%' },
  techniqueCardWrap: { flex: 1, minWidth: 0 },
  techniqueCard: { borderRadius: 18, borderWidth: 1.5, minHeight: 116, paddingHorizontal: 13, paddingVertical: 13, width: '100%' },
  techniqueEmoji: { fontSize: 28, lineHeight: 34 },
  techniqueName: { fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 7 },
  techniqueLink: { fontFamily: typography.bodyExtraBold, fontSize: 10, marginTop: 5 },
  recentSection: { marginTop: 24 },
  sectionHeadingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  flushHeading: { marginBottom: 10 },
  seeAllButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 6 },
  seeAll: { color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: 11.5 },
  progressSection: { marginBottom: 2 },
  lessonCard: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', gap: 12, marginTop: 24, minHeight: 78, paddingHorizontal: 14, paddingVertical: 12 },
  lessonIcon: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  lessonCopy: { flex: 1 },
  lessonTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  lessonBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 15, marginTop: 2 },
  emptyCard: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 2, padding: 20 },
  emptyBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
}));
