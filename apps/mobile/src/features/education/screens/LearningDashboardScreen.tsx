import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { LearningConnectionsNotice } from '../components/LearningConnectionsNotice';
import { LearningDailyGoal } from '../components/LearningDailyGoal';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Href, useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/AuthProvider';
import AnimatedPressable from '@/components/AnimatedPressable';
import { NotificationBell } from '@/components/NotificationBell';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useMemorySets } from '@/features/memory-sets';
import { useDueMemoryReviews } from '@/features/practice-attempts';
import EducationAssignmentsScreen from './EducationAssignmentsScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LearningIconButton } from '../components/LearningIconButton';
import { LearningButton, LearningSkeleton, useLearningCopy, useLearningStyles } from '../components/LearningUi';
import { LearningLevelProgress } from '../components/LearningLevelProgress';
import { usePersonalStudyCourses } from '../hooks/usePersonalStudy';
import { useLearningActivity } from '../hooks/useLearningActivity';
import { useEducationGuidedHomeProgress, useEducationPublicCourse, useEducationPublicCourses, useEducationSavedCourses } from '../hooks/useEducationPracticeItems';
import { useMyEducationAssignments } from '../hooks/useMyEducationAssignments';
import { getEducationAssignmentStatus } from '../utils/educationAssignmentStatus';
import { learningResumeRoute } from '../utils/learningActivity';
import { useEducationLearningPreferences } from '../hooks/useEducationLearningPreferences';
import { recommendFirstCourse } from '../utils/educationLearningPreferences';

export default function LearningDashboardScreen() {
  const { user } = useAuth();
  return user?.accountMode === 'RestrictedLearner' ? <EducationAssignmentsScreen /> : <StandardLearningDashboard />;
}

function StandardLearningDashboard() {
  const { user } = useAuth(); const { zh } = useLearningCopy(); const { styles: s, theme } = useLearningStyles(); const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useCurrentUser(); const personal = usePersonalStudyCourses(); const saved = useEducationSavedCourses();
  const activity = useLearningActivity(); const home = useEducationGuidedHomeProgress(); const tasks = useMyEducationAssignments();
  const reviews = useDueMemoryReviews(); const memory = useMemorySets(); const catalog = useEducationPublicCourses('');
  const preferences = useEducationLearningPreferences(user?.id ?? '');
  const latestPublicId = activity.data?.find(item => item.source === 'public')?.courseId ?? '';
  const recentPublic = useEducationPublicCourse(latestPublicId);
  const { refetch: refreshPersonal } = personal; const { refetch: refreshSaved } = saved;
  const { refetch: refreshHome } = home; const { refetch: refreshTasks } = tasks; const { refetch: refreshReviews } = reviews;
  const { refetch: refreshMemory } = memory;
  const refresh = useCallback(() => { void Promise.allSettled([refreshPersonal(), refreshSaved(), refreshHome(), refreshTasks(), refreshReviews(), refreshMemory()]); },
    [refreshPersonal, refreshSaved, refreshHome, refreshTasks, refreshReviews, refreshMemory]);
  useFocusEffect(refresh);
  const push = (route: string) => router.push(route as Href);
  const library = () => router.navigate('/(tabs)/learn' as Href);
  const discover = () => router.navigate('/discover' as Href);
  const ready = personal.data?.filter(item => item.readyToLearn) ?? [];
  const recent = activity.data?.find(item => item.source === 'personal' ? ready.some(course => course.id === item.courseId)
    : saved.data?.some(course => course.id === item.courseId) || home.data?.courseId === item.courseId || recentPublic.data?.id === item.courseId);
  const recentTitle = recent?.source === 'personal' ? ready.find(course => course.id === recent.courseId)?.title
    : saved.data?.find(course => course.id === recent?.courseId)?.title ?? (home.data?.courseId === recent?.courseId ? home.data?.courseTitle : recentPublic.data?.title);
  const task = tasks.data?.find(item => getEducationAssignmentStatus(item) === 'open');
  const review = reviews.data?.[0];
  const activeMemory = memory.data?.find(item => item.status !== 'archived');
  const first = recommendFirstCourse(catalog.data ?? [], preferences.query.data ?? null).course;
  const draft = personal.data?.find(item => !item.readyToLearn);
  const loading = personal.isLoading || saved.isLoading || home.isLoading || activity.isLoading || tasks.isLoading || reviews.isLoading || memory.isLoading || (!ready.length && !saved.data?.length && !home.data && !activeMemory && (catalog.isLoading || preferences.query.isLoading));
  const failedSources = activity.isError || personal.isError || saved.isError || home.isError || tasks.isError || reviews.isError || memory.isError;
  const action = recent && recentTitle ? { title: recentTitle, hint: zh ? '接着上次的内容，一小步就好' : 'Pick up where you left off', label: zh ? '继续学习' : 'Continue learning', run: () => push(learningResumeRoute(recent)) }
    : home.data ? { title: home.data.courseTitle, hint: zh ? '回到正在学习的课程' : 'Return to your current course', label: zh ? '继续学习' : 'Continue learning', run: () => push(learningResumeRoute({ source: 'public', courseId: home.data!.courseId })) }
      : task ? { title: task.title, hint: zh ? '家长或老师为你准备的任务' : 'A task from your family or teacher', label: zh ? '开始任务' : 'Start task', run: () => push(`/education/assignments?assignmentId=${encodeURIComponent(task.id)}`) }
        : review ? { title: review.memorySetTitle, hint: zh ? '今天该复习一下了' : 'Ready for a little review', label: zh ? '开始复习' : 'Start review', run: () => push(`/memory-review/${encodeURIComponent(review.memorySetId)}?scope=due`) }
          : ready[0] ? { title: ready[0].title, hint: zh ? '你准备好的学习内容' : 'Your study content is ready', label: zh ? '开始学习' : 'Start learning', run: () => push(learningResumeRoute({ source: 'personal', courseId: ready[0].id })) }
            : saved.data?.[0] ? { title: saved.data[0].title, hint: zh ? '从收藏的课程开始' : 'Start with a course you saved', label: zh ? '开始学习' : 'Start learning', run: () => push(learningResumeRoute({ source: 'public', courseId: saved.data![0].id })) }
            : activeMemory ? { title: activeMemory.title, hint: zh ? '用熟悉的记忆练习热热身' : 'Warm up with your memory practice', label: zh ? '打开练习' : 'Open practice', run: () => push(`/memory-details/${encodeURIComponent(activeMemory.id)}`) }
              : draft ? { title: draft.title, hint: zh ? '还有一份资料等你完成' : 'Finish the content you started', label: zh ? '继续编辑' : 'Continue editing', run: () => push(`/education/create-course?draftId=${encodeURIComponent(draft.id)}`) }
                : first && !failedSources ? { title: first.title, hint: zh ? '从这门体验课开始' : 'Try your first lesson', label: zh ? '开始体验' : 'Try a lesson', run: () => push(learningResumeRoute({ source: 'public', courseId: first.id })) } : null;
  const ownRows = [...(personal.data ?? [])].sort((a, b) => {
    const rank = (id: string) => activity.data?.findIndex(item => item.source === 'personal' && item.courseId === id) ?? -1;
    return (rank(a.id) < 0 ? Infinity : rank(a.id)) - (rank(b.id) < 0 ? Infinity : rank(b.id));
  }).slice(0, 3);
  const failed = failedSources;
  return <View style={s.page}>
    <View style={[s.row, { paddingHorizontal: appSpacing.lg, paddingTop: insets.top + 6, paddingBottom: 6, justifyContent: 'space-between' }]}>
      <CompanionActor stage={profile.user?.level ?? 1} size={48} cue={{ action: 'hello', sequence: 0 }} />
      <View style={s.row}><NotificationBell /><LearningIconButton icon="add" label={zh ? '添加学习内容' : 'Add study content'} onPress={() => push('/education/create-course')} /></View>
    </View>
    <ScrollView contentContainerStyle={[s.content, { gap: 18 }]} refreshControl={<RefreshControl refreshing={personal.isRefetching || home.isRefetching} onRefresh={refresh} />}>
      <View style={[s.row, { alignItems: 'center' }]}><View style={{ flex: 1, gap: 6 }}><Text accessibilityRole="header" style={[s.title, appTextStyles.pageTitle]}>{zh ? `你好，${profile.user?.displayName || user?.displayName || 'MemoPal'}！` : `Hi, ${profile.user?.displayName || user?.displayName || 'MemoPal'}!`}</Text><Text style={s.small}>{zh ? '今天也和沫沫一起，学一点点' : 'One little step with Momo today'}</Text></View></View>
      {profile.user ? <LearningLevelProgress totalXp={profile.user.totalXp} level={profile.user.level} /> : null}
      {loading ? <LearningSkeleton /> : action ? <View style={[s.card, { backgroundColor: theme.hero[0], borderColor: theme.primaryShadow, padding: appSpacing.xl, gap: 14 }]}>
        <Text style={[s.small, { color: theme.heroInk }]}>{action.hint}</Text><Text style={[s.title, { color: theme.heroInk }]}>{action.title}</Text>
        <LearningButton tone="white" label={action.label} onPress={action.run} />
      </View> : failed ? null : <View style={s.card}><Text style={s.heading}>{zh ? '今天想学什么？' : 'What would you like to learn?'}</Text><Text style={s.body}>{zh ? '添加自己的词表，或找一门喜欢的课程。' : 'Bring your own words or discover a course.'}</Text><LearningButton label={zh ? '添加学习内容' : 'Add study content'} onPress={() => push('/education/create-course')} /></View>}
      {failed ? <View style={s.card}><Text accessibilityRole="alert" style={s.small}>{zh ? '部分学习记录暂时没加载出来，已加载的资料仍可使用。' : 'Some learning records could not load. Your available materials still work.'}</Text><LearningButton secondary label={zh ? '重新加载' : 'Retry'} onPress={() => { refresh(); void activity.refetch(); void catalog.refetch(); void preferences.query.refetch(); }} /></View> : null}
      <LearningDailyGoal />
      <LearningConnectionsNotice />
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        <DashboardShortcut icon="checkbox-outline" title={zh ? '我的任务' : 'My tasks'} detail={tasks.isError ? (zh ? '点击重试' : 'Open to retry') : zh ? `${tasks.data?.filter(item => getEducationAssignmentStatus(item) === 'open').length ?? 0} 个可学习任务` : `${tasks.data?.length ?? 0} assignments`} onPress={() => push('/education/assignments')} />
        <DashboardShortcut icon="refresh-outline" title={zh ? '今日复习' : 'Review today'} detail={reviews.isError ? (zh ? '点击重试' : 'Open to retry') : zh ? `${reviews.data?.length ?? 0} 项待复习` : `${reviews.data?.length ?? 0} items due`} onPress={review ? () => push(`/memory-review/${encodeURIComponent(review.memorySetId)}?scope=due`) : () => router.navigate('/(tabs)/library?section=memory' as Href)} />
      </View>
      <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.heading}>{zh ? '我的学习资料' : 'My materials'}</Text><TextLink label={zh ? '查看全部' : 'View all'} onPress={library} /></View>
      {ownRows.map(item => <DashboardMaterial key={item.id} title={item.title} detail={`${zh ? '我创建的' : 'Created'} · ${item.studyItemCount} ${zh ? '张卡片' : 'cards'}`} action={item.readyToLearn ? (zh ? '学习' : 'Study') : (zh ? '续编' : 'Edit')} onPress={() => push(item.readyToLearn ? learningResumeRoute({ source: 'personal', courseId: item.id }) : `/education/create-course?draftId=${encodeURIComponent(item.id)}`)} />)}
      {(saved.data ?? []).slice(0, Math.max(1, 3 - ownRows.length)).map(item => <DashboardMaterial key={item.id} title={item.title} detail={zh ? '已收藏课程' : 'Saved course'} action={zh ? '学习' : 'Study'} onPress={() => push(learningResumeRoute({ source: 'public', courseId: item.id }))} />)}
      {!ownRows.length && !saved.data?.length && !personal.isLoading && !personal.isError && !saved.isError ? <Text style={s.small}>{zh ? '创建或收藏的课程会出现在这里。记忆练习可以从底部「记忆」进入。' : 'Your created and saved courses appear here. Find memory practice in the Memory tab.'}</Text> : null}
      <AnimatedPressable accessibilityRole="button" onPress={discover} style={[s.card, s.row]}><Ionicons name="compass-outline" size={27} color={theme.violetDeep} /><View style={{ flex: 1, gap: appSpacing.xs }}><Text style={s.heading}>{zh ? '发现新课程' : 'Discover courses'}</Text><Text style={s.small}>{zh ? '想学点新的，再来这里逛逛' : 'Find something new when you are ready'}</Text></View><Ionicons name="chevron-forward" size={20} color={theme.violetDeep} /></AnimatedPressable>
      <TextLink label={zh ? '查看学习记录与报告' : 'Learning history and reports'} onPress={() => push('/progress')} />
    </ScrollView>
  </View>;
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const { styles: s, theme } = useLearningStyles();
  return <AnimatedPressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: appSpacing.xs }}><Text style={[s.small, { color: theme.violetDeep }]}>{label} →</Text></AnimatedPressable>;
}
function DashboardShortcut({ icon, title, detail, onPress }: { icon: 'checkbox-outline' | 'refresh-outline'; title: string; detail: string; onPress: () => void }) {
  const { styles: s, theme } = useLearningStyles();
  return <AnimatedPressable accessibilityRole="button" onPress={onPress} style={[s.card, { flex: 1, minWidth: 125 }]}><Ionicons name={icon} size={23} color={theme.violetDeep} /><Text style={s.heading}>{title}</Text><Text style={s.small}>{detail}</Text></AnimatedPressable>;
}
function DashboardMaterial({ title, detail, action, onPress }: { title: string; detail: string; action: string; onPress: () => void }) {
  const { styles: s, theme } = useLearningStyles();
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${title} · ${action}`} onPress={onPress} style={[s.card, s.row]}><View style={{ padding: 10, borderRadius: appRadii.control, backgroundColor: theme.violetTint }}><Ionicons name="book-outline" size={22} color={theme.violetDeep} /></View><View style={{ flex: 1, minWidth: 0, gap: appSpacing.xs }}><Text numberOfLines={2} style={s.heading}>{title}</Text><Text style={s.small}>{detail}</Text></View><Ionicons name="chevron-forward" size={20} color={theme.violetDeep} /></AnimatedPressable>;
}
