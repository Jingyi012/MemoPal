import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue';
import { useAuth } from '@/contexts/AuthProvider';
import { useEducationCopy } from '../i18n';
import { learningTypography as typography } from '@/features/education/theme/learningTheme';
import { useEducationGuidedCourseProgress, useEducationGuidedCoursesProgress, useEducationGuidedHomeProgress, useEducationPublicCourses } from '../hooks/useEducationPracticeItems';
import { LearningArrival, LearningButton, LearningProgress, LearningRing, LearningSkeleton, SubjectArtwork, useLearningStyles, learningThemeFor, useLearningCopy } from '../components/LearningUi';
import { learningSubjectFor, courseAudienceLabels, matchesCourseAudience, emptyCourseAudience } from '../utils/educationCourseAudience';
import { LearningFirstLessonCard } from '../components/LearningFirstLessonCard';
import { recommendFirstCourse } from '../utils/educationLearningPreferences';
import { useEducationLearningPreferences } from '../hooks/useEducationLearningPreferences';
import { LearningPreferencesCard } from '../components/LearningPreferencesCard';
import type { EducationPublicCourseSummary } from '../types/educationPractice.types';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { Ionicons } from '@expo/vector-icons';
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
    <CommonHeader title={primaryEntry ? copy.learnTitle : copy.publicCoursesTitle} hideBackButton={primaryEntry} backAction={primaryEntry ? undefined : () => router.back()} />
    <FlatList data={data} keyExtractor={item => item.id} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={courses.isRefetching} onRefresh={() => refresh.current()} />}
      ListHeaderComponent={<LearningArrival style={{ gap: 18 }}>
        <View style={s.row}><View style={{ flex: 1, gap: 7 }}><Text style={s.title}>{ui.hello(profile.user?.displayName || user?.displayName || 'MemoPal')}</Text><Text style={s.body}>{ui.ready}</Text>
          <View style={[s.row, { flexWrap: 'wrap' }]}>{profile.user?.stats ? <HomeStatChip label={`🔥 ${profile.user.stats.currentStreak} ${ui.zh ? '天' : 'days'}`} /> : null}{profile.user ? <HomeStatChip label={`✦ ${profile.user.totalXp} XP`} /> : null}</View>
        </View><CompanionActor stage={profile.user?.level ?? 1} size={90} cue={{ action: 'hello', sequence: 0 }} /></View>
        {current ? <LinearGradient colors={palette.hero as [string, string]} start={[0, 0]} end={[1, 1]} style={{ borderRadius: 26, padding: 18, gap: 13, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -5, bottom: -16, opacity: .16 }}><Ionicons name={theme.icon} size={112} color="#FFFFFF" /></View>
          <View style={[s.row, { alignItems: 'flex-start' }]}><View style={{ flex: 1, gap: 7 }}><View style={{ alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: '#FFFFFF', fontFamily: typography.bodyExtraBold, fontSize: 12 }}>{ui.continue}</Text></View><Text numberOfLines={2} style={[s.heading, { color: '#FFFFFF', fontSize: 21, lineHeight: 27 }]}>{current.courseTitle}</Text><Text style={[s.body, { color: '#FFFFFF' }]}>{ui.correct(solved, total)}</Text></View><LearningRing value={solved} total={total} theme={{ ...theme, line: 'rgba(255,255,255,.28)', color: palette.sun, dark: '#FFFFFF' }} /></View>
          <View style={{ alignSelf: 'flex-start' }}><LearningButton tone="white" compact label={ui.continue} onPress={() => router.push(`/community/education/${current.courseId}` as Href)} /></View>
        </LinearGradient> : null}
        {home.isError ? <AnimatedPressable onPress={() => void home.refetch()} style={s.card}><Text style={s.body}>{copy.guidedLessonLoadError} · {copy.retry}</Text></AnimatedPressable> : null}
        {firstCourse ? <LearningFirstLessonCard course={firstCourse} onPress={() => router.push(`/community/education/${firstCourse.id}` as Href)} /> : null}
        {firstCourse && recommendation.isFallback ? <Text style={s.small}>{ui.zh ? '暂时没有完全符合偏好的课程，先探索这节体验课吧。' : 'No course matches all your preferences yet. Explore this lesson while more content is prepared.'}</Text> : null}
        {user?.id ? <LearningPreferencesCard key={user.id} userId={user.id} /> : null}
        <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/assignments' as Href)} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.mintTint, borderColor: palette.mintLine }]}>
          <Ionicons name="school-outline" size={26} color={palette.successText} />
          <View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>{ui.zh ? '我的学习任务' : 'My learning tasks'}</Text><Text style={s.small}>{ui.zh ? '查看家长和老师安排的学习' : 'Learning from your family and teachers'}</Text></View>
          <Ionicons name="chevron-forward" size={22} color={palette.successText} />
        </AnimatedPressable>
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
        <Text accessibilityRole="header" style={s.heading}>{copy.learnCoursesTitle}</Text>
      </LearningArrival>}
      renderItem={({ item }) => <CourseCard course={item} onPress={() => router.push(`/community/education/${item.id}` as Href)} />}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      ListEmptyComponent={courses.isLoading ? <LearningSkeleton /> : courses.isError ? <View style={s.card}><Text accessibilityRole="alert" style={s.body}>{copy.publicCoursesError}</Text><LearningButton secondary label={copy.retry} onPress={() => void courses.refetch()} /></View> : <View style={[s.card, { alignItems: 'center' }]}><CompanionActor stage={profile.user?.level ?? 1} size={88} cue={{ action: 'think', sequence: 0 }} /><Text style={s.body}>{hasFilters || search.trim() ? (ui.zh ? '还没有符合这些条件的课程。换个条件探索看看吧。' : 'No courses match yet. Try another filter and explore.') : ui.empty}</Text>{hasFilters || search.trim() ? <LearningButton secondary label={ui.zh ? '查看全部课程' : 'Explore all courses'} onPress={() => { clearFilters(); setSearch(''); }} /> : null}</View>}
      ListFooterComponent={<View style={{ gap: 14, marginTop: 20 }}>
        <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/create-course' as Href)} style={[s.card, { gap: 8 }]}>
          <Text style={s.heading}>{ui.zh ? '制作自己的小课' : 'Create your own lessons'}</Text>
          <Text style={s.small}>{ui.zh ? '家长可扫描或粘贴学校词表，先预览，再保存为教学草稿。' : 'Parents can scan or paste a school word list, preview it, and save a teaching draft.'}</Text>
        </AnimatedPressable>
        <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/(tabs)/practice' as Href)} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <Ionicons name="sparkles-outline" size={24} color={palette.violetDeep} />
          <View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>{ui.zh ? '需要一点记忆帮助？' : 'Need a little memory help?'}</Text><Text style={s.small}>{ui.zh ? '可选工具：用场景和联想帮助记忆' : 'Optional tools: remember with places and stories'}</Text></View>
          <Ionicons name="chevron-forward" size={20} color={palette.violetDeep} />
        </AnimatedPressable>
        <View style={[s.row, { justifyContent: 'space-around', marginTop: 20 }]}>{[['/community/education/saved', copy.publicSavedCourses], ['/community/education/history', copy.publicPracticeHistory]].map(([path, label]) => <AnimatedPressable key={path} onPress={() => router.push(path as Href)} style={{ minHeight: 44, justifyContent: 'center', flex: 1 }}><Text style={s.small}>{label} →</Text></AnimatedPressable>)}</View></View>}
    />
    <Modal transparent visible={filterOpen} animationType="slide" onRequestClose={() => setFilterOpen(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(20,16,40,.45)', justifyContent: 'flex-end' }}>
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
function HomeStatChip({ label }: { label: string }) {
  const { theme, styles } = useLearningStyles();
  return <View style={{ backgroundColor: theme.paper, borderColor: theme.line, borderWidth: 2, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={styles.small}>{label}</Text></View>;
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
function CourseCard({ course, onPress }: { course: EducationPublicCourseSummary; onPress: () => void }) {
  const { styles: s, theme: palette } = useLearningStyles();
  const progress = useEducationGuidedCourseProgress(course.id); const ui = useLearningCopy(); const theme = learningThemeFor(course.title, palette, course.subjectCode);
  const lessons = progress.data?.lessons;
  const solved = lessons?.reduce((n, lesson) => n + lesson.questionsSolved, 0) ?? 0;
  const total = lessons?.reduce((n, lesson) => n + lesson.questionCount, 0) ?? course.questionCount;
  const completed = !!lessons?.length && lessons.every(lesson => lesson.isComplete);
  const subjectLabel = theme.key === 'other' ? (ui.zh ? '课程' : 'Course') : ui[theme.key];
  const coverColors = theme.gradient;
  return <AnimatedPressable lively onPress={onPress} style={[s.card, { borderColor: palette.line, padding: 0, overflow: 'hidden', gap: 0 }]}>
    <LinearGradient colors={coverColors as [string, string]} start={[0, 0]} end={[1, 1]} style={{ height: 104, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <View style={{ position: 'absolute', right: -25, top: -34, width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(255,255,255,.24)' }} />
      <View style={{ position: 'absolute', left: 12, top: 12, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5, backgroundColor: palette.paper }}><Text style={[s.small, { color: theme.dark }]}>{subjectLabel}</Text></View>
      <SubjectArtwork theme={theme} size={68} />
      <Ionicons name="chevron-forward-circle" size={30} color={theme.color} style={{ position: 'absolute', right: 12, top: 12 }} />
    </LinearGradient>
    <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 15, gap: 8 }}>
      {course.isMemoPalStarter ? <Text style={[s.small, { color: palette.violetDeep }]}>{ui.zh ? '✦ MemoPal 体验课' : '✦ MemoPal starter'}</Text> : null}
      <Text numberOfLines={2} style={s.heading}>{course.title}</Text>
      {courseAudienceLabels(course, ui.zh).length ? <Text style={s.small}>{courseAudienceLabels(course, ui.zh).join(' · ')}</Text> : null}
      <View style={[s.row, { flexWrap: 'wrap', gap: 6 }]}><Text style={s.small}>📚 {course.assessmentCount} {ui.zh ? '个练习' : 'lessons'}</Text><Text style={s.small}>·</Text><Text style={s.small}>❓ {course.questionCount} {ui.zh ? '题' : 'questions'}</Text><Text style={s.small}>·</Text><Text style={s.small}>⏱ {ui.time(course.questionCount).split('·')[1]?.trim()}</Text></View>
      {progress.isLoading ? <Text style={s.small}>…</Text> : progress.isError ? <Text style={s.small}>—</Text> : <><LearningProgress value={solved} total={total} color={theme.color} /><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.small}>{ui.correct(solved, total)}</Text><Text style={[s.small, { color: theme.dark }]}>{completed ? `✓ ${ui.done}` : lessons?.some(lesson => lesson.isStarted) ? ui.underway : ui.notStarted}</Text></View></>}
    </View>
  </AnimatedPressable>;
}
