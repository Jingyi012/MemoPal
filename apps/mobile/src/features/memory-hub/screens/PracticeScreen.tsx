import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useEnabledMemoryModules } from '@/core/memory';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { useDueMemoryReviews, useUpcomingMemoryReviews } from '@/features/practice-attempts';
import type { DueMemoryReview } from '@/features/practice-attempts';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { PracticeDiscoveryRow } from '@/features/memory-hub/components/PracticeDiscoveryRow';
import { MemorySetCard } from '@/components/MemorySetCard';
import { LevelProgressHeader } from '@/features/gamification/achievements/components/LevelProgressHeader';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { useTranslation } from '@/core/i18n/useTranslation';
import { usePredefinedMemoryLessons } from '@/features/predefined-memory-lessons';
import type { PredefinedMemoryLesson } from '@/features/predefined-memory-lessons';
import { memopalThemes } from '@/theme/memopalTheme';
import { getUnlockedPegCount } from '@/features/number-peg/utils/numberPegMap';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { ChevronRight, Plus, RefreshCcw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export default function PracticeScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { language, t } = useTranslation('practice');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const modules = useEnabledMemoryModules();
  const numberPegEnabled = modules.some((module) => module.key === 'number-peg');
  const palaceEnabled = modules.some((module) => module.key === 'palace');
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
  const unlockedPegCount = getUnlockedPegCount(user?.level ?? 1);
  const palaceScenes = usePalaceScenes();
  const lessons = usePredefinedMemoryLessons();
  const [lessonCategoryId, setLessonCategoryId] = useState<string>('all');
  const lessonCategories = useMemo(() => {
    const byId = new Map<string, PredefinedMemoryLesson['category']>();
    (lessons.data ?? []).forEach((lesson) => byId.set(lesson.category.id, lesson.category));
    return [...byId.values()].sort((left, right) => left.sortOrder - right.sortOrder);
  }, [lessons.data]);
  const visibleLessons = useMemo(
    () =>
      (lessons.data ?? []).filter(
        (lesson) =>
          (lessonCategoryId === 'all' || lesson.categoryId === lessonCategoryId) &&
          (lesson.techniqueKey === 'palace' ? palaceEnabled : numberPegEnabled)
      ),
    [lessonCategoryId, lessons.data, numberPegEnabled, palaceEnabled]
  );
  const recentSets = useMemo(
    () =>
      (memorySets.data ?? []).filter((memorySet) => memorySet.status !== 'archived').slice(0, 2),
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
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        hideBackButton
      />
      <View style={styles.progressHeaderWrap}>
        <LevelProgressHeader level={practiceLevel} streak={user?.stats?.currentStreak ?? 0} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {(!isOffline && memorySets.isLoading) ||
        (canShowRequestErrors && memorySets.isError) ||
        recentSets.length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionLabel, styles.recentHeading, { color: activeTheme.ink }]}>
                {t('recentPractice')}
              </Text>
              <AnimatedPressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/library' as Href)}
                style={styles.seeAllButton}>
                <Text style={styles.seeAll}>{t('seeAll')} →</Text>
              </AnimatedPressable>
            </View>

            {!isOffline && memorySets.isLoading ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyBody}>{t('recentPractice')}</Text>
              </View>
            ) : canShowRequestErrors && memorySets.isError ? (
              <ModuleNoticeCard
                icon={<RefreshCcw size={22} color={theme.inkSoft} />}
                title={t('recentPractice')}
                body={t('description')}
                actionLabel={t('tryAgain')}
                onAction={() => memorySets.refetch()}
              />
            ) : recentSets.length ? (
              <View style={styles.sessionList}>
                {recentSets.map((memorySet) => (
                  <MemorySetCard
                    key={memorySet.id}
                    memorySet={memorySet}
                    reviewAt={reviewByMemorySetId.get(memorySet.id)?.dueAt}
                    actionLabel={t('practiceNow')}
                    onOpen={() => openMemorySet(router, memorySet)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.techniqueHeadingRow}>
          <Text style={[styles.sectionLabel, styles.techniqueHeading, { color: activeTheme.ink }]}>
            {t('jumpTechnique')}
          </Text>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t('newMemory')}
            onPress={() => router.push('/create-memory' as Href)}
            style={styles.newMemoryButton}>
            <Plus size={15} color={theme.onSun} />
            <Text style={styles.newMemoryButtonText}>{t('newMemory')}</Text>
          </AnimatedPressable>
        </View>
        <View style={styles.techniqueRow}>
          {modules.map((module) => {
            const isPeg = module.key === 'number-peg';
            return (
              <View key={module.key} style={styles.techniqueJumpWrap}>
                <AnimatedPressable
                  onPress={() => router.push(module.route as Href)}
                  style={[
                    styles.techniqueJump,
                    {
                      backgroundColor: isPeg ? activeTheme.berryTint : activeTheme.violetTint,
                      borderColor: isPeg ? activeTheme.berryLine : activeTheme.violetLine,
                    },
                  ]}>
                  <Text style={styles.techniqueJumpEmoji}>{isPeg ? '🕯️' : '🏰'}</Text>
                  <View style={styles.techniqueJumpCopy}>
                    <Text
                      numberOfLines={1}
                      style={[styles.techniqueJumpName, { color: activeTheme.ink }]}>
                      {isPeg ? t('numberPeg') : t('palace')}
                    </Text>
                    <Text
                      style={[
                        styles.techniqueJumpLink,
                        { color: isPeg ? activeTheme.berryDeep : activeTheme.violetDeep },
                      ]}>
                      {t('tapToStart')} →
                    </Text>
                  </View>
                </AnimatedPressable>
              </View>
            );
          })}
        </View>

        {numberPegEnabled ? (
          <PracticeDiscoveryRow
            title={t('yourPegSet')}
            actionLabel={`${t('seeAll')} →`}
            onAction={() => router.push('/number-peg/map' as Href)}
            items={PEG_ANCHORS.slice(0, Math.min(10, unlockedPegCount)).map((peg) => ({
              key: String(peg.number),
              title: `${peg.number}. ${peg.name}`,
              subtitle: peg.emoji,
              tone: 'peg' as const,
            }))}
            onItemPress={() => router.push('/number-peg/map' as Href)}
          />
        ) : null}

        {palaceEnabled ? (
          <PracticeDiscoveryRow
            title={t('yourPalaces')}
            actionLabel={`${t('seeAll')} →`}
            onAction={() => router.push('/palaces/map' as Href)}
            items={(palaceScenes.data ?? []).slice(0, 4).map((scene) => ({
              key: scene.id,
              title: scene.name,
              subtitle: `${scene.loci.length} ${t('loci')}`,
              imageUrl: scene.imageUrl,
              imageSource: scene.imageSource,
              tone: 'palace' as const,
            }))}
            onItemPress={(sceneId) =>
              router.push({ pathname: '/palaces/create-memory', params: { sceneId } })
            }
            emptyLabel={palaceScenes.isLoading ? t('yourPalaces') : t('palace')}
          />
        ) : null}

        <View style={styles.discoverySection}>
          <View style={styles.sectionHeadingRow}>
            <Text style={[styles.sectionLabel, styles.discoveryTitle, { color: activeTheme.ink }]}>
              {t('tryLesson')}
            </Text>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('allLessons')}
              onPress={() => router.push('/lessons' as Href)}
              style={styles.lessonLibraryButton}>
              <Text style={styles.lessonLibraryEmoji}>📚</Text>
              <Text style={styles.lessonLibraryText}>{t('allLessons')}</Text>
              <ChevronRight size={15} color={activeTheme.violetDeep} />
            </AnimatedPressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lessonFilterRow}>
            {[
              { id: 'all', emoji: '', nameEn: t('all'), nameZh: t('all') },
              ...lessonCategories,
            ].map((category) => (
              <AnimatedPressable
                key={category.id}
                onPress={() => setLessonCategoryId(category.id)}
                style={[
                  styles.lessonFilterChip,
                  lessonCategoryId === category.id && styles.lessonFilterChipActive,
                ]}>
                <Text
                  style={[
                    styles.lessonFilterText,
                    lessonCategoryId === category.id && styles.lessonFilterTextActive,
                  ]}>
                  {category.emoji ? `${category.emoji} ` : ''}
                  {language === 'zh' ? category.nameZh : category.nameEn}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
          {!isOffline && lessons.isLoading ? (
            <View style={styles.lessonLoading}>
              <Text style={styles.emptyBody}>{t('loadingLessons')}</Text>
            </View>
          ) : canShowRequestErrors && lessons.isError ? (
            <ModuleNoticeCard
              icon={<RefreshCcw size={22} color={theme.inkSoft} />}
              title={t('lessonsUnavailable')}
              body={t('lessonsUnavailableBody')}
              actionLabel={t('tryAgain')}
              onAction={() => lessons.refetch()}
            />
          ) : visibleLessons.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lessonList}>
              {visibleLessons.map((lesson) => {
                const localized = localizeLesson(lesson, language);
                return (
                  <AnimatedPressable
                    key={lesson.id}
                    onPress={() => openLesson(router, lesson, language)}
                    style={styles.lessonCard}>
                    <View
                      style={[
                        styles.lessonEmojiWrap,
                        lesson.techniqueKey === 'palace' && styles.lessonEmojiWrapPalace,
                      ]}>
                      <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
                    </View>
                    <Text numberOfLines={2} style={styles.lessonTitle}>
                      {localized.title}
                    </Text>
                    <Text numberOfLines={2} style={styles.lessonDescription}>
                      {localized.description}
                    </Text>
                    <Text style={styles.lessonCount}>
                      {lesson.items.length} {lesson.items.length === 1 ? t('item') : t('items')}
                    </Text>
                    <View style={styles.lessonMetaRow}>
                      <Text
                        style={[
                          styles.lessonTechnique,
                          lesson.techniqueKey === 'palace' && styles.lessonTechniquePalace,
                        ]}>
                        {lesson.techniqueKey === 'palace' ? t('palace') : t('numberPeg')}
                      </Text>
                      <Text style={styles.lessonCategory}>
                        {lesson.category.emoji}{' '}
                        {language === 'zh' ? lesson.category.nameZh : lesson.category.nameEn}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.lessonLoading}>
              <Text style={styles.emptyBody}>{t('noLessons')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function localizeLesson(lesson: PredefinedMemoryLesson, language: 'en' | 'zh') {
  return {
    title: language === 'zh' ? lesson.titleZh : lesson.titleEn,
    description: language === 'zh' ? lesson.descriptionZh : lesson.descriptionEn,
    items: lesson.items
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((item) => (language === 'zh' ? item.contentZh : item.contentEn)),
  };
}

function openLesson(
  router: ReturnType<typeof useRouter>,
  lesson: PredefinedMemoryLesson,
  language: 'en' | 'zh'
) {
  const localized = localizeLesson(lesson, language);
  const path = lesson.techniqueKey === 'palace' ? '/palaces/create-memory' : '/number-peg/create';
  router.push(
    `${path}?title=${encodeURIComponent(localized.title)}&goalType=${lesson.goalType}&items=${encodeURIComponent(JSON.stringify(localized.items))}` as Href
  );
}

function openMemorySet(router: ReturnType<typeof useRouter>, memorySet: MemorySet) {
  router.push(`/memory-details/${memorySet.id}` as Href);
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: 20, paddingBottom: 42 },
    progressHeaderWrap: { paddingHorizontal: 20, paddingTop: 10 },
    sectionLabel: {
      color: theme.inkSoft,
      fontFamily: typography.bodyExtraBold,
      fontSize: 13,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 22,
      marginBottom: 10,
    },
    techniqueHeadingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 22,
      marginBottom: 10,
    },
    techniqueHeading: { flexShrink: 1, marginTop: 0, marginBottom: 0 },
    newMemoryButton: {
      alignItems: 'center',
      backgroundColor: theme.sun,
      borderRadius: 13,
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 11,
    },
    newMemoryButtonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 11 },
    recentSection: { marginBottom: 2 },
    recentHeading: { marginTop: 0, marginBottom: 10 },
    seeAllButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
    techniqueRow: { width: '100%', flexDirection: 'row', gap: 8 },
    techniqueJumpWrap: { flex: 1, minWidth: 0 },
    techniqueJump: {
      width: '100%',
      minHeight: 70,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      paddingVertical: 10,
      paddingHorizontal: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    techniqueJumpEmoji: { fontSize: 26, lineHeight: 32 },
    techniqueJumpCopy: { flex: 1, minWidth: 0 },
    techniqueJumpName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12.5 },
    techniqueJumpLink: {
      color: theme.link,
      fontFamily: typography.bodyExtraBold,
      fontSize: 9.5,
      marginTop: 3,
    },
    sectionHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 1,
    },
    discoverySection: { marginTop: 24 },
    discoveryTitle: { marginTop: 0, marginBottom: 0 },
    lessonLibraryButton: {
      alignItems: 'center',
      backgroundColor: theme.violetTint,
      borderColor: theme.violetLine,
      borderRadius: 13,
      borderWidth: 1.5,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 10,
    },
    lessonLibraryEmoji: { fontSize: 15 },
    lessonLibraryText: {
      color: theme.violetDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 10.5,
    },
    lessonHint: {
      color: theme.link,
      fontFamily: typography.bodyExtraBold,
      fontSize: 11,
      marginTop: 0,
    },
    lessonList: { gap: 10, paddingTop: 10, paddingBottom: 10, paddingRight: 12 },
    lessonFilterRow: { flexDirection: 'row', gap: 7, marginTop: 10, paddingRight: 12 },
    lessonFilterChip: {
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    lessonFilterChipActive: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint },
    lessonFilterText: {
      color: theme.inkSoft,
      fontFamily: typography.bodyExtraBold,
      fontSize: 10.5,
    },
    lessonFilterTextActive: { color: theme.violetDeep },
    lessonCard: {
      width: 200,
      minHeight: 210,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      padding: 12,
      shadowColor: theme.violetDeep,
      shadowOpacity: 0.07,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    lessonEmojiWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.berryTint,
    },
    lessonEmojiWrapPalace: { backgroundColor: theme.violetTint },
    lessonEmoji: { fontSize: 25 },
    lessonTitle: {
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 15,
      lineHeight: 20,
      marginTop: 6,
    },
    lessonDescription: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
      minHeight: 30,
    },
    lessonCount: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 10.5,
      marginTop: 4,
    },
    lessonMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 9,
    },
    lessonTechnique: {
      alignSelf: 'flex-start',
      color: theme.berryDeep,
      backgroundColor: theme.berryTint,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 4,
      fontFamily: typography.bodyExtraBold,
      fontSize: 9.5,
    },
    lessonTechniquePalace: { color: theme.violetDeep, backgroundColor: theme.violetTint },
    lessonCategory: {
      color: theme.inkSoft,
      backgroundColor: theme.peachTint,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 4,
      fontFamily: typography.bodyExtraBold,
      fontSize: 9.5,
    },
    lessonLoading: {
      minHeight: 92,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      padding: 18,
      justifyContent: 'center',
      marginTop: 10,
    },
    seeAll: { color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: 11.5 },
    sessionList: { gap: 10 },
    emptyIconEmoji: { fontSize: 24 },
    sessionCard: {
      minHeight: 70,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      padding: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    emptyCard: {
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.line,
      backgroundColor: theme.paper,
      padding: 20,
      alignItems: 'center',
    },
    emptyBody: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 4,
    },
  })
);

const PEG_ANCHORS = [
  { number: 1, emoji: '🕯️', name: 'Candle' },
  { number: 2, emoji: '🦢', name: 'Swan' },
  { number: 3, emoji: '❤️', name: 'Heart' },
  { number: 4, emoji: '⛵', name: 'Sailboat' },
  { number: 5, emoji: '✋', name: 'Hand' },
  { number: 6, emoji: '🐘', name: 'Elephant' },
  { number: 7, emoji: '🌈', name: 'Rainbow' },
  { number: 8, emoji: '⛄', name: 'Snowman' },
  { number: 9, emoji: '🎈', name: 'Balloon' },
  { number: 10, emoji: '⚾', name: 'Bat & ball' },
];
