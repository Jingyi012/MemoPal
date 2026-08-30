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
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { getUnlockedPegCount } from '@/features/number-peg/utils/numberPegMap';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { Plus, RefreshCcw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PracticeScreen() {
  const router = useRouter();
  const { language, t } = useTranslation('practice');
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
    title: levelInfo?.currentLevelConfig?.title ?? 'Memory Apprentice',
  };
  const unlockedPegCount = getUnlockedPegCount(user?.level ?? 1);
  const palaceScenes = usePalaceScenes();
  const lessons = usePredefinedMemoryLessons();
  const [filter, setFilter] = useState<'all' | 'number-peg' | 'palace'>('all');
  const [lessonCategoryId, setLessonCategoryId] = useState<string>('all');
  const lessonCategories = useMemo(() => {
    const byId = new Map<string, PredefinedMemoryLesson['category']>();
    (lessons.data ?? []).forEach((lesson) => byId.set(lesson.category.id, lesson.category));
    return [...byId.values()].sort((left, right) => left.sortOrder - right.sortOrder);
  }, [lessons.data]);
  const visibleLessons = useMemo(
    () => (lessons.data ?? []).filter((lesson) =>
      (lessonCategoryId === 'all' || lesson.categoryId === lessonCategoryId)
      && (lesson.techniqueKey === 'palace' ? palaceEnabled : numberPegEnabled),
    ),
    [lessonCategoryId, lessons.data, numberPegEnabled, palaceEnabled],
  );
  const recentSets = useMemo(
    () => (memorySets.data ?? [])
      .filter((memorySet) => memorySet.status !== 'archived')
      .filter((memorySet) => filter === 'all' || memorySet.techniqueKey === filter)
      .slice(0, 4),
    [filter, memorySets.data]
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
        <ModuleNoticeCard
          icon={<Text style={styles.emptyIconEmoji}>✨</Text>}
          title={t('newMemory')}
          body={t('newMemoryBody')}
          actionLabel={t('tapToStart')}
          actionIcon={<Plus size={15} color={theme.ink} />}
          onAction={() => router.push('/create-memory' as Href)}
        />

        <Text style={styles.sectionLabel}>{t('jumpTechnique')}</Text>
        <View style={styles.techniqueRow}>
          {modules.map((module) => {
            const isPeg = module.key === 'number-peg';
            return (
              <View key={module.key} style={styles.techniqueJumpWrap}>
                <AnimatedPressable
                  onPress={() => router.push(module.route as Href)}
                  style={styles.techniqueJump}>
                  <Text style={styles.techniqueJumpEmoji}>{isPeg ? '🕯️' : '🏰'}</Text>
                  <Text style={styles.techniqueJumpName}>{isPeg ? t('numberPeg') : t('palace')}</Text>
                  <Text style={styles.techniqueJumpLink}>{t('tapToStart')} →</Text>
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
            <Text style={[styles.sectionLabel, styles.discoveryTitle]}>{t('tryLesson')}</Text>
            <Text style={styles.lessonHint}>{t('tapToStart')}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lessonFilterRow}>
            {([{ id: 'all', emoji: '', nameEn: t('all'), nameZh: t('all') }, ...lessonCategories]).map((category) => (
              <AnimatedPressable
                key={category.id}
                onPress={() => setLessonCategoryId(category.id)}
                style={[styles.lessonFilterChip, lessonCategoryId === category.id && styles.lessonFilterChipActive]}>
                <Text style={[styles.lessonFilterText, lessonCategoryId === category.id && styles.lessonFilterTextActive]}>
                  {category.emoji ? `${category.emoji} ` : ''}{language === 'zh' ? category.nameZh : category.nameEn}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
          {lessons.isLoading ? (
            <View style={styles.lessonLoading}><Text style={styles.emptyBody}>{t('loadingLessons')}</Text></View>
          ) : lessons.isError ? (
            <ModuleNoticeCard
              icon={<RefreshCcw size={22} color={theme.inkSoft} />}
              title={t('lessonsUnavailable')}
              body={t('lessonsUnavailableBody')}
              actionLabel={t('tryAgain')}
              onAction={() => lessons.refetch()}
            />
          ) : visibleLessons.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lessonList}>
            {visibleLessons.map((lesson) => {
              const localized = localizeLesson(lesson, language);
              return (
              <AnimatedPressable
                key={lesson.id}
                onPress={() => openLesson(router, lesson, language)}
                style={styles.lessonCard}>
                <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
                <Text numberOfLines={2} style={styles.lessonTitle}>{localized.title}</Text>
                <Text numberOfLines={2} style={styles.lessonDescription}>{localized.description}</Text>
                <Text style={styles.lessonCount}>{lesson.items.length} {lesson.items.length === 1 ? t('item') : t('items')}</Text>
                <View style={styles.lessonMetaRow}>
                  <Text style={[styles.lessonTechnique, lesson.techniqueKey === 'palace' && styles.lessonTechniquePalace]}>
                    {lesson.techniqueKey === 'palace' ? t('palace') : t('numberPeg')}
                  </Text>
                  <Text style={styles.lessonCategory}>{lesson.category.emoji} {language === 'zh' ? lesson.category.nameZh : lesson.category.nameEn}</Text>
                </View>
              </AnimatedPressable>
            );})}
          </ScrollView>
          ) : (
            <View style={styles.lessonLoading}><Text style={styles.emptyBody}>{t('noLessons')}</Text></View>
          )}
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>{t('recentPractice')}</Text>
          <AnimatedPressable onPress={() => router.push('/(tabs)/library' as Href)}>
            <Text style={styles.seeAll}>{t('seeAll')} →</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.filterRow}>
          {SESSION_FILTERS.filter((option) => option.key === 'all' || (option.key === 'palace' ? palaceEnabled : numberPegEnabled)).map((option) => (
            <AnimatedPressable
              key={option.key}
              onPress={() => setFilter(option.key)}
              style={[styles.filterChip, filter === option.key && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === option.key && styles.filterChipTextActive]}>
                {option.key === 'all' ? t('all') : option.key === 'number-peg' ? t('numberPeg') : t('palace')}
              </Text>
            </AnimatedPressable>
          ))}
        </View>

        {memorySets.isLoading ? (
          <View style={styles.emptyCard}><Text style={styles.emptyBody}>{t('recentPractice')}</Text></View>
        ) : memorySets.isError ? (
          <ModuleNoticeCard
            icon={<RefreshCcw size={22} color={theme.inkSoft} />}
            title={t('recentPractice')}
            body={t('description')}
            onAction={() => memorySets.refetch()}
          />
        ) : recentSets.length ? (
          <View style={styles.sessionList}>
            {recentSets.map((memorySet) => (
                <MemorySetCard
                key={memorySet.id}
                memorySet={memorySet}
                reviewAt={reviewByMemorySetId.get(memorySet.id)?.dueAt}
                onOpen={() => openMemorySet(router, memorySet)}
              />
            ))}
          </View>
        ) : (
          <ModuleNoticeCard
            icon={<Text style={styles.emptyIconEmoji}>✨</Text>}
            title={t('newMemory')}
            body={t('newMemoryBody')}
            actionLabel={t('tapToStart')}
            actionIcon={<Plus size={15} color={theme.ink} />}
            onAction={() => router.push('/create-memory' as Href)}
          />
        )}
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
      .map((item) => language === 'zh' ? item.contentZh : item.contentEn),
  };
}

function openLesson(router: ReturnType<typeof useRouter>, lesson: PredefinedMemoryLesson, language: 'en' | 'zh') {
  const localized = localizeLesson(lesson, language);
  const path = lesson.techniqueKey === 'palace' ? '/palaces/create-memory' : '/number-peg/build';
  router.push(`${path}?title=${encodeURIComponent(localized.title)}&goalType=${lesson.goalType}&items=${encodeURIComponent(JSON.stringify(localized.items))}` as Href);
}

function openMemorySet(router: ReturnType<typeof useRouter>, memorySet: MemorySet) {
  router.push(`/memory-details/${memorySet.id}` as Href);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 42 },
  progressHeaderWrap: { paddingHorizontal: 16, paddingTop: 10 },
  sectionLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  techniqueRow: { width: '100%', flexDirection: 'row', gap: 8 },
  techniqueJumpWrap: { flex: 1, minWidth: 0, minHeight: 104 },
  techniqueJump: { width: '100%', minHeight: 104, borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
  techniqueJumpEmoji: { fontSize: 26, lineHeight: 30 },
  techniqueJumpName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12.5, textAlign: 'center', marginTop: 7 },
  techniqueJumpLink: { color: theme.sky, fontFamily: typography.bodyExtraBold, fontSize: 10.5, marginTop: 3 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 },
  discoverySection: { marginTop: 24 },
  discoveryTitle: { marginTop: 0, marginBottom: 0 },
  lessonHint: { color: theme.sky, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 0 },
  lessonList: { gap: 10, paddingTop: 10, paddingBottom: 10, paddingRight: 12 },
  lessonFilterRow: { flexDirection: 'row', gap: 7, marginTop: 10, paddingRight: 12 },
  lessonFilterChip: { borderRadius: 999, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 10, paddingVertical: 6 },
  lessonFilterChipActive: { borderColor: theme.violetDeep, backgroundColor: '#EEE9FF' },
  lessonFilterText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10.5 },
  lessonFilterTextActive: { color: theme.violetDeep },
  lessonCard: { width: 184, minHeight: 190, borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 12 },
  lessonEmoji: { fontSize: 27 },
  lessonTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12.5, lineHeight: 16, marginTop: 6 },
  lessonDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10.5, lineHeight: 15, marginTop: 4, minHeight: 30 },
  lessonCount: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10.5, marginTop: 4 },
  lessonMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 9 },
  lessonTechnique: { alignSelf: 'flex-start', color: theme.berryDeep, backgroundColor: '#FFF0F4', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  lessonTechniquePalace: { color: theme.violetDeep, backgroundColor: '#EEE9FF' },
  lessonCategory: { color: theme.inkSoft, backgroundColor: '#F4F1EA', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  lessonLoading: { minHeight: 92, borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 18, justifyContent: 'center', marginTop: 10 },
  filterRow: { flexDirection: 'row', gap: 7, marginTop: 9, marginBottom: 11 },
  filterChip: { borderRadius: 999, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 10, paddingVertical: 6 },
  filterChipActive: { borderColor: theme.ink, backgroundColor: theme.ink },
  filterChipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10.5 },
  filterChipTextActive: { color: 'white' },
  seeAll: { color: theme.sky, fontFamily: typography.bodyExtraBold, fontSize: 11.5, marginTop: 22 },
  sessionList: { gap: 10 },
  emptyIconEmoji: { fontSize: 24 },
  sessionCard: { minHeight: 70, borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  emptyCard: { borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 20, alignItems: 'center' },
  emptyBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 4 },
});

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

const SESSION_FILTERS: { key: 'all' | 'number-peg' | 'palace' }[] = [
  { key: 'all' },
  { key: 'number-peg' },
  { key: 'palace' },
];
