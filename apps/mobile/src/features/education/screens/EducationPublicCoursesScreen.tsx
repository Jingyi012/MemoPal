import { LearningIconButton } from '../components/LearningIconButton';
import AnimatedPressable from '@/components/AnimatedPressable';
import { getLevelProgressMetrics } from '@/components/LevelXpProgressBar';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue';
import { useAuth } from '@/contexts/AuthProvider';
import { useEducationCopy } from '../i18n';
import { learningTypography as typography } from '@/features/education/theme/learningTheme';
import { useEducationGuidedCoursesProgress, useEducationGuidedHomeProgress, useEducationPublicCourses } from '../hooks/useEducationPracticeItems';
import { LearningArrival, LearningButton, LearningProgress, LearningRing, LearningSkeleton, useLearningStyles, learningThemeFor, useLearningCopy } from '../components/LearningUi';
import { learningSubjectFor, courseAudienceLabels, matchesCourseAudience, emptyCourseAudience } from '../utils/educationCourseAudience';
import { LearningFirstLessonCard } from '../components/LearningFirstLessonCard';
import { recommendFirstCourse } from '../utils/educationLearningPreferences';
import { useEducationLearningPreferences } from '../hooks/useEducationLearningPreferences';
import { LearningPreferencesCard } from '../components/LearningPreferencesCard';
import { LearningCatalogCourseCard } from '../components/LearningCatalogCourseCard';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CourseSubject = 'all' | 'chinese' | 'science' | 'math' | 'english';
type CourseStatus = 'all' | 'inProgress' | 'new' | 'completed';

export default function EducationPublicCoursesScreen({ primaryEntry = false }: { primaryEntry?: boolean }) {
  const { styles: s, theme: palette } = useLearningStyles();
  const copy = useEducationCopy(); const ui = useLearningCopy(); const router = useRouter();
  const { user } = useAuth(); const profile = useCurrentUser(); const home = useEducationGuidedHomeProgress(); const insets = useSafeAreaInsets();
  const learningPreferences = useEducationLearningPreferences(user?.id ?? '');
  const [search, setSearch] = useState(''); const [subject, setSubject] = useState<CourseSubject>('all'); const [status, setStatus] = useState<CourseStatus>('all');
  const [filterOpen, setFilterOpen] = useState(false); const [draftSubject, setDraftSubject] = useState<CourseSubject>('all'); const [draftStatus, setDraftStatus] = useState<CourseStatus>('all');
  const [audience, setAudience] = useState(emptyCourseAudience);
  const [draftAudience, setDraftAudience] = useState(emptyCourseAudience);
  const catalog = useEducationPublicCourses('');
  const courses = useEducationPublicCourses(useDebouncedValue(search, 300));
  const progressQueries = useEducationGuidedCoursesProgress((courses.data ?? []).map(course => course.id));
  const refresh = useRef(() => { void courses.refetch(); void home.refetch(); });
  refresh.current = () => { void courses.refetch(); void home.refetch(); };
  useFocusEffect(useCallback(() => { if (user?.id && user.accountMode !== 'RestrictedLearner') refresh.current(); }, [user?.id, user?.accountMode]));
  const data = useMemo(() => (courses.data ?? []).filter((course, index) => {
    if (!matchesCourseAudience(course, audience)) return false;
    if (subject !== 'all' && learningSubjectFor(course.title, course.subjectCode) !== subject) return false;
    if (status === 'all') return true;
    const lessons = progressQueries[index]?.data?.lessons;
    if (!lessons) return false;
    const completed = lessons.length > 0 && lessons.every(lesson => lesson.isComplete);
    const started = lessons.some(lesson => lesson.isStarted);
    return status === 'completed' ? completed : status === 'inProgress' ? started && !completed : !started;
  }), [courses.data, progressQueries, status, subject, audience]);
  if (user?.accountMode === 'RestrictedLearner') return <Redirect href="/education/assignments" />;
  const hasFilters = subject !== 'all' || status !== 'all' || audience.stage !== 'all' || audience.language !== 'all';
  const clearFilters = () => { setSubject('all'); setStatus('all'); setAudience(emptyCourseAudience); };
  const current = home.data;
  const recommendation = recommendFirstCourse(catalog.data ?? [], learningPreferences.query.data ?? null);
  const firstCourse = home.isSuccess && !current && !learningPreferences.query.isLoading ? recommendation.course : undefined;
  const theme = learningThemeFor(current?.courseTitle ?? '', palette, catalog.data?.find(course => course.id === current?.courseId)?.subjectCode);
  const total = current?.lessons.reduce((n, lesson) => n + lesson.questionCount, 0) ?? 0;
  const solved = current?.lessons.reduce((n, lesson) => n + lesson.questionsSolved, 0) ?? 0;
  return <View style={s.page}>
    <CommonHeader showAiCredits={false} title={primaryEntry ? copy.learnTitle : copy.publicCoursesTitle} hideBackButton={primaryEntry} backAction={primaryEntry ? undefined : () => router.back()}
      actions={[
        { component: <LearningIconButton variant="plain" icon="bookmark-outline" label={copy.publicSavedCourses} onPress={() => router.push('/community/education/saved' as Href)} /> },
        { component: <LearningIconButton variant="plain" icon="time-outline" label={copy.publicPracticeHistory} onPress={() => router.push('/community/education/history' as Href)} /> },
        { component: <LearningIconButton variant="plain" icon="add" label={ui.zh ? '创建学习内容' : 'Create study content'} onPress={() => router.push('/education/create-course' as Href)} /> },
      ]} />
    <FlatList data={data} keyExtractor={item => item.id} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={courses.isRefetching} onRefresh={() => refresh.current()} />}
      ListHeaderComponent={<LearningArrival style={{ gap: 18 }}>
        <View style={{ gap: 12 }}>
          <View style={{ gap: 3 }}><Text style={[s.heading, { fontSize: 20 }]}>{ui.hello(profile.user?.displayName || user?.displayName || 'MemoPal')}</Text><Text style={s.small}>{ui.ready}</Text></View>
          {profile.user ? <HomeLevelProgress totalXp={profile.user.totalXp} level={profile.user.level} /> : null}
        </View>
        {current ? <LinearGradient colors={palette.hero as [string, string]} start={[0, 0]} end={[1, 1]} style={{ borderRadius: 26, padding: 18, gap: 13, overflow: 'hidden' }}>
          <View style={[s.row, { alignItems: 'flex-start' }]}><View style={{ flex: 1, gap: 7 }}><View style={{ alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5, backgroundColor: palette.heroOverlay }}><Text style={{ color: palette.heroInk, fontFamily: typography.bodyExtraBold, fontSize: 12 }}>{ui.continue}</Text></View><Text numberOfLines={3} style={[s.heading, { color: palette.heroInk, fontSize: 21, lineHeight: 27 }]}>{current.courseTitle}</Text><Text style={[s.body, { color: palette.heroInk }]}>{ui.correct(solved, total)}</Text></View><LearningRing value={solved} total={total} theme={{ ...theme, line: palette.heroTrack, color: palette.heroAccent, dark: palette.heroInk }} /></View>
          <View style={{ alignSelf: 'flex-start' }}><LearningButton tone="white" compact label={ui.zh ? '继续学习' : 'Continue'} onPress={() => router.push(`/community/education/${current.courseId}` as Href)} /></View>
        </LinearGradient> : null}
        {home.isError ? <AnimatedPressable onPress={() => void home.refetch()} style={s.card}><Text style={s.body}>{copy.guidedLessonLoadError} · {copy.retry}</Text></AnimatedPressable> : null}
        {firstCourse ? <LearningFirstLessonCard course={firstCourse} onPress={() => router.push(`/community/education/${firstCourse.id}` as Href)} /> : null}
        {firstCourse && recommendation.isFallback ? <Text style={s.small}>{ui.zh ? '暂时没有完全符合偏好的课程，先探索这节体验课吧。' : 'No course matches all your preferences yet. Explore this lesson while more content is prepared.'}</Text> : null}

        <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/my-courses' as Href)} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
          <Ionicons name="folder-open-outline" size={24} color={palette.violetDeep} />
          <View style={{ flex: 1 }}><Text style={s.heading}>{ui.zh ? '我的学习内容' : 'My study content'}</Text><Text style={s.small}>{ui.zh ? '自己添加的内容与草稿' : 'Your own content and drafts'}</Text></View>
          <Ionicons name="chevron-forward" size={20} color={palette.violetDeep} />
        </AnimatedPressable>
        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
          {user?.id ? <LearningPreferencesCard key={user.id} userId={user.id} compact /> : null}
          <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/assignments' as Href)} style={[s.card, { flex: 1, minWidth: 0, minHeight: 108, padding: 14, gap: 6, justifyContent: 'center', backgroundColor: palette.mintTint, borderColor: palette.mintLine }]}>
            <Text style={[s.small, { color: palette.successText, fontFamily: typography.bodyExtraBold }]}>{ui.zh ? '我的任务' : 'My tasks'}</Text>
            <Text style={s.small}>{ui.zh ? '来自家长和老师' : 'From family and teachers'}</Text>
          </AnimatedPressable>
        </View>
        <View style={[s.row, { gap: 9 }]}>
          <View style={[s.row, { flex: 1, borderWidth: 2, borderColor: palette.line, backgroundColor: palette.paper, borderRadius: 18, paddingHorizontal: 14, gap: 8 }]}>
            <Ionicons name="search" size={22} color={palette.inkSoft} /><TextInput accessibilityLabel={copy.publicCoursesSearch} placeholder={ui.zh ? '搜索课程或知识点' : 'Search courses or study points'} value={search} onChangeText={setSearch} placeholderTextColor={palette.inkSoft} style={[s.body, { flex: 1, minHeight: 52 }]} returnKeyType="search" />
          </View>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel={ui.filter} accessibilityState={{ expanded: filterOpen, selected: hasFilters }} onPress={() => { Keyboard.dismiss(); setDraftSubject(subject); setDraftStatus(status); setDraftAudience(audience); setFilterOpen(true); }} style={{ minHeight: 52, minWidth: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: hasFilters ? palette.violetDeep : palette.line, backgroundColor: palette.paper, borderRadius: 18 }}><Ionicons name="options-outline" size={23} color={palette.violetDeep} /></AnimatedPressable>
        </View>
        {hasFilters ? <View style={[s.row, { flexWrap: 'wrap' }]}>
          {subject !== 'all' ? <FilterPill label={ui[subject as Exclude<CourseSubject, 'all'>]} onRemove={() => setSubject('all')} /> : null}
          {status !== 'all' ? <FilterPill label={ui[status as Exclude<CourseStatus, 'all'>]} onRemove={() => setStatus('all')} /> : null}
          {audience.stage !== 'all' ? <FilterPill label={courseAudienceLabels({ learningStage: audience.stage }, ui.zh)[0]} onRemove={() => setAudience({ ...audience, stage: 'all' })} /> : null}
          {audience.language !== 'all' ? <FilterPill label={courseAudienceLabels({ languageCode: audience.language }, ui.zh)[0]} onRemove={() => setAudience({ ...audience, language: 'all' })} /> : null}
          <AnimatedPressable onPress={clearFilters} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 }}><Text style={[s.small, { color: palette.violetDeep }]}>{ui.clearFilters}</Text></AnimatedPressable>
        </View> : null}
        <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text accessibilityRole="header" style={s.heading}>{copy.learnCoursesTitle}</Text>{courses.isSuccess ? <Text style={s.small}>{ui.zh ? `${data.length} 门课程` : `${data.length} available`}</Text> : null}</View>
      </LearningArrival>}
      renderItem={({ item }) => <LearningCatalogCourseCard course={item} onPress={() => router.push(`/community/education/${item.id}` as Href)} />}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      ListEmptyComponent={courses.isLoading ? <LearningSkeleton /> : courses.isError ? <View style={s.card}><Text accessibilityRole="alert" style={s.body}>{copy.publicCoursesError}</Text><LearningButton secondary label={copy.retry} onPress={() => void courses.refetch()} /></View> : <View style={[s.card, { alignItems: 'center' }]}><CompanionActor stage={profile.user?.level ?? 1} size={88} cue={{ action: 'think', sequence: 0 }} /><Text style={s.body}>{hasFilters || search.trim() ? (ui.zh ? '还没有符合这些条件的课程。换个条件探索看看吧。' : 'No courses match yet. Try another filter and explore.') : ui.empty}</Text>{hasFilters || search.trim() ? <LearningButton secondary label={ui.zh ? '查看全部课程' : 'Explore all courses'} onPress={() => { clearFilters(); setSearch(''); }} /> : null}</View>}

    />
    <Modal transparent visible={filterOpen} animationType="slide" onRequestClose={() => setFilterOpen(false)}>
      <View style={{ flex: 1, backgroundColor: palette.scrim, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={ui.close} onPress={() => setFilterOpen(false)} style={{ flex: 1 }} />
        <ScrollView style={{ maxHeight: '85%', backgroundColor: palette.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28 }} contentContainerStyle={{ padding: 20, paddingBottom: Math.max(20, insets.bottom), gap: 12, borderWidth: 1, borderColor: palette.line }}>
          <View style={s.row}><Text accessibilityRole="header" style={[s.title, { flex: 1 }]}>{ui.filter}</Text><AnimatedPressable accessibilityLabel={ui.close} onPress={() => setFilterOpen(false)} style={{ minHeight: 44, width: 44, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="close" size={23} color={palette.ink} /></AnimatedPressable></View>
          <Text style={s.small}>{ui.filterSubject}</Text>
          <View style={[s.row, { flexWrap: 'wrap' }]}>{(['all', 'chinese', 'science', 'math', 'english'] as const).map(key => <FilterOption key={key} selected={draftSubject === key} label={ui[key]} onPress={() => setDraftSubject(key)} />)}</View>
          <Text accessibilityRole="header" style={s.small}>{ui.zh ? '学习阶段' : 'Learning stage'}</Text>
          <View style={[s.row, { flexWrap: 'wrap' }]}>{['all', 'early-primary', 'upper-primary', 'secondary', 'general'].map(stage => <FilterOption key={stage} selected={draftAudience.stage === stage} label={stage === 'all' ? ui.all : courseAudienceLabels({ learningStage: stage }, ui.zh)[0]} onPress={() => setDraftAudience({ ...draftAudience, stage })} />)}</View>
          <Text accessibilityRole="header" style={s.small}>{ui.zh ? '内容语言' : 'Content language'}</Text>
          <View style={[s.row, { flexWrap: 'wrap' }]}>{['all', 'zh-Hans', 'en', 'ms'].map(language => <FilterOption key={language} selected={draftAudience.language === language} label={language === 'all' ? ui.all : courseAudienceLabels({ languageCode: language }, ui.zh)[0]} onPress={() => setDraftAudience({ ...draftAudience, language })} />)}</View>
          <Text style={s.small}>{ui.filterStatus}</Text>
          <View style={[s.row, { flexWrap: 'wrap' }]}>{(['all', 'inProgress', 'new', 'completed'] as const).map(key => <FilterOption key={key} selected={draftStatus === key} label={ui[key]} onPress={() => setDraftStatus(key)} />)}</View>
          <View style={[s.row, { gap: 10, marginTop: 4 }]}>
            <View style={{ flex: 1 }}><LearningButton secondary label={ui.reset} onPress={() => { setDraftSubject('all'); setDraftStatus('all'); setDraftAudience(emptyCourseAudience); }} /></View>
            <View style={{ flex: 1 }}><LearningButton label={ui.showCourses((courses.data ?? []).filter((course, index) => {
              if (!matchesCourseAudience(course, draftAudience)) return false;
              if (draftSubject !== 'all' && learningSubjectFor(course.title, course.subjectCode) !== draftSubject) return false;
              if (draftStatus === 'all') return true;
              const lessons = progressQueries[index]?.data?.lessons;
              if (!lessons) return false;
              const completed = lessons.length > 0 && lessons.every(lesson => lesson.isComplete);
              const started = lessons.some(lesson => lesson.isStarted);
              return draftStatus === 'completed' ? completed : draftStatus === 'inProgress' ? started && !completed : !started;
            }).length)} onPress={() => { setSubject(draftSubject); setStatus(draftStatus); setAudience(draftAudience); setFilterOpen(false); }} /></View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  </View>;
}
function HomeLevelProgress({ totalXp, level }: { totalXp: number; level: number }) {
  const { styles: s, theme } = useLearningStyles();
  const { zh } = useLearningCopy();
  const query = useLevelByXp(totalXp, level);
  const progress = query.levelInfo;
  const metrics = progress ? getLevelProgressMetrics(progress.xpInCurrentLevel, progress.xpToNextLevel) : null;
  return <View style={{ gap: 6 }}>
    <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
      <Text style={[s.small, { color: theme.violetDeep, fontFamily: typography.bodyExtraBold }]}>{zh ? '等级' : 'Level'} {progress?.currentLevel ?? level}</Text>
      {progress ? <Text style={s.small}>{metrics?.isMaxLevel ? (zh ? '已达最高等级' : 'Max level') : `${zh ? '下一级' : 'Next'}: ${progress.currentLevel + 1}`}</Text> : null}
    </View>
    {metrics ? <LearningProgress value={metrics.progress} total={100} color={theme.violetDeep} height={8} /> : query.isError ? <AnimatedPressable accessibilityRole="button" onPress={() => void query.refetch()} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={s.small}>{zh ? '等级进度暂不可用，点击重试' : 'Level progress unavailable. Tap to retry.'}</Text></AnimatedPressable> : <View accessibilityLabel={zh ? '正在读取等级进度' : 'Loading level progress'} style={{ height: 8, borderRadius: 99, backgroundColor: theme.violetTint }} />}
  </View>;
}
function FilterOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { styles: s, theme } = useLearningStyles();
  return <AnimatedPressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 99, borderWidth: 1.5, borderColor: selected ? theme.violetDeep : theme.line, backgroundColor: selected ? theme.violetDeep : theme.paper }}><Text style={[s.small, { color: selected ? theme.onAccent : theme.ink }]}>{label}</Text></AnimatedPressable>;
}
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { styles: s, theme } = useLearningStyles();
  const ui = useLearningCopy();
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${label}, ${ui.removeFilter}`} onPress={onRemove} style={{ minHeight: 44, borderRadius: 99, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.violetTint }}><Text style={[s.small, { color: theme.violetDeep }]}>{label}</Text><Ionicons name="close" size={16} color={theme.violetDeep} /></AnimatedPressable>;
}
