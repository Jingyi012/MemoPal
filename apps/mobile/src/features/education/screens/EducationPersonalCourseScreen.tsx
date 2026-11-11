import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing } from '@/theme/designSystem';
import { LearningIconButton } from '../components/LearningIconButton';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Href, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { LearningCourseHero } from '../components/LearningCourseHero';
import { LearningCourseUnits } from '../components/LearningCourseUnits';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LearningHeader } from '../components/LearningHeader';
import { LearningButton, LearningSkeleton, LearningThemeContext, learningThemeFor, useLearningCopy, useLearningStyles } from '../components/LearningUi';
import { LearningStudySession, type LearningReadingPosition } from '../components/LearningStudySession';
import { useLearningActivity } from '../hooks/useLearningActivity';
import { usePersonalStudyCourse } from '../hooks/usePersonalStudy';
import { useStartOrResumeEducationGuidedSession, useEducationGuidedCourseProgress } from '../hooks/useEducationPracticeItems';

export default function EducationPersonalCourseScreen() {
  const { courseId = '', start } = useLocalSearchParams<{ courseId: string; start?: string }>();
  const { user } = useAuth(); const router = useRouter(); const { zh } = useLearningCopy(); const { styles: s, theme: palette } = useLearningStyles();
  const insets = useSafeAreaInsets();
  const course = usePersonalStudyCourse(courseId);
  const activity = useLearningActivity();
  const restored = useRef('');
  const { touch } = activity;
  const progress = useEducationGuidedCourseProgress(course.data?.readyToLearn ? courseId : ''); const practice = useStartOrResumeEducationGuidedSession();
  const [selected, setSelected] = useState<number | null>(null);
  const [resumeIndex, setResumeIndex] = useState(0);
  const [reading, setReading] = useState<LearningReadingPosition>({ position: 0, finished: false });
  useEffect(() => { setSelected(null); setResumeIndex(0); setReading({ position: 0, finished: false }); }, [courseId, start]);
  useEffect(() => {
    const identity = `${user?.id}:${courseId}:${start}`;
    if (start !== '1' || !course.data?.readyToLearn || activity.isLoading || restored.current === identity) return;
    const last = activity.data?.find(item => item.source === 'personal' && item.courseId === courseId);
    const index = Math.max(0, course.data.units.findIndex(item => item.id === last?.sectionId));
    const unit = course.data.units[index];
    if (!unit) return;
    restored.current = identity;
    touch({ source: 'personal', courseId });
    setSelected(index); setResumeIndex(index);
    setReading({ position: Math.min(last?.position ?? 0, Math.max(0, unit.studyItems.length - 1)), finished: last?.finished ?? false });
  }, [activity.data, activity.isLoading, course.data, courseId, start, user?.id, touch]);
  if (user?.accountMode === 'RestrictedLearner') return <Redirect href="/education/assignments" />;
  const units = course.data?.units ?? [];
  const path = {
    units: units.map((item, position) => ({ id: item.id, title: item.title, position, objectiveIds: [item.objectiveId] })),
    objectives: units.map(item => ({ id: item.objectiveId, title: item.title, studyItems: item.studyItems, recommendedMemorySet: null })),
  };
  const cardCount = units.reduce((sum, item) => sum + item.studyItems.length, 0);
  const questionCount = progress.data?.lessons.reduce((sum, lesson) => sum + lesson.questionCount, 0) ?? 0;
  const solved = progress.data?.lessons.reduce((sum, lesson) => sum + lesson.questionsSolved, 0) ?? 0;
  const subjectTheme = learningThemeFor('', palette, course.data?.languageCode?.startsWith('en') ? 'english' : 'chinese');
  const openStudy = (index: number, resume = false) => {
    if (!resume || index !== resumeIndex || reading.finished) setReading({ position: 0, finished: false });
    setSelected(index); setResumeIndex(index);
    if (units[index]) activity.touch({ source: 'personal', courseId, sectionId: units[index].id, position: resume && index === resumeIndex && !reading.finished ? reading.position : 0, finished: false });
  };
  const openPractice = (assessmentId: string) => practice.mutate({ courseId, assessmentId }, {
    onSuccess: session => router.push(`/community/education/guided/${session.sessionId}` as Href),
  });
  const recommendedIndex = units.findIndex(item => item.assessmentId === progress.data?.nextRecommendedAssessmentId);
  const continueIndex = recommendedIndex >= 0 ? recommendedIndex : Math.min(resumeIndex, Math.max(0, units.length - 1));
  const unit = selected === null ? undefined : course.data?.units[selected];
  return <LearningThemeContext.Provider value={subjectTheme}><View style={s.page}>
    <LearningHeader title={selected !== null ? (course.data?.title ?? (zh ? '学习内容' : 'Study content')) : (zh ? '课程' : 'Course')} showAiCredits={false} actions={selected === null && course.data ? [{ component: <LearningIconButton icon="copy-outline" variant="plain" label={zh ? '用此内容创建副本' : 'Create a copy from this content'} onPress={() => router.push(`/education/create-course?draftId=${encodeURIComponent(courseId)}` as Href)} /> }] : []}
      backAction={() => { if (selected !== null && start !== '1') setSelected(null); else router.back(); }} />
    {course.isLoading ? <LearningSkeleton /> : course.isError || !course.data ? <View style={s.card}><Text accessibilityRole="alert" style={s.body}>{zh ? '无法加载学习内容。' : 'Could not load study content.'}</Text><LearningButton label={zh ? '重试' : 'Retry'} onPress={() => void course.refetch()} /></View>
      : !course.data.readyToLearn ? <View style={s.card}><Text style={s.body}>{zh ? '这份内容还在草稿中。' : 'This content is still a draft.'}</Text><LearningButton label={zh ? '继续编辑' : 'Continue editing'} onPress={() => router.replace(`/education/create-course?draftId=${courseId}` as Href)} /></View>
        : unit ? <LearningStudySession objective={{ id: unit.objectiveId, title: unit.title, studyItems: unit.studyItems, recommendedMemorySet: null }} reading={reading} onReadingChange={value => { setReading(value); activity.touch({ source: 'personal', courseId, sectionId: unit.id, position: value.position, finished: value.finished }); }}
          practiceTitle={unit.assessmentId ? unit.title : undefined} practiceQuestionCount={unit.assessmentId ? progress.data?.lessons.find(lesson => lesson.assessmentId === unit.assessmentId)?.questionCount : 0}
          finishLabel={!unit.assessmentId ? (selected! < course.data.units.length - 1 ? (zh ? '学习下一个单元' : 'Next unit') : (zh ? '返回学习内容' : 'Back to my content')) : undefined}
          onMemory={() => {}} onFinish={() => {
            if (unit.assessmentId) openPractice(unit.assessmentId);
            else if (selected! < course.data!.units.length - 1) { openStudy(selected! + 1); }
            else setSelected(null);
          }} /> : <>
          <ScrollView contentContainerStyle={[s.content, { gap: appSpacing.xl, paddingBottom: appSpacing.xxl }]}>
            <LearningCourseHero title={course.data.title} theme={subjectTheme} subtitle={zh ? '由你创建 · 仅自己可见' : 'Created by you · Private'}
              caption={questionCount > 0 ? (zh ? `已答对 ${solved}/${questionCount}` : `${solved}/${questionCount} solved`) : (zh ? '从学习卡片开始，一步步记住它' : 'Explore your study cards, one step at a time')}
              progress={questionCount > 0 ? { value: solved, total: questionCount } : undefined} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[{ value: units.length, label: zh ? '学习单元' : 'Units' }, { value: cardCount, label: zh ? '学习卡片' : 'Study cards' }, ...(questionCount > 0 ? [{ value: questionCount, label: zh ? '练习题' : 'Questions' }] : [])].map(stat =>
                <View key={stat.label} style={[s.card, { flex: 1, minWidth: 0, alignItems: 'center', padding: 14, gap: 3 }]}><Text style={[s.title, { color: palette.violetDeep }]}>{stat.value}</Text><Text style={s.small}>{stat.label}</Text></View>)}
            </View>
            {progress.isError ? <View style={s.card}><Text accessibilityRole="alert" style={s.small}>{zh ? '练习进度加载失败，学习卡片仍可使用。' : 'Practice progress could not load. Your study cards are still available.'}</Text><LearningButton secondary label={zh ? '重试进度' : 'Retry progress'} onPress={() => void progress.refetch()} /></View> : null}
            <LearningCourseUnits course={path} progress={progress.data} compactUnits currentObjectiveId={units[continueIndex]?.objectiveId} onMemory={() => {}} onPractice={openPractice}
              onStudy={id => { const index = units.findIndex(item => item.objectiveId === id); if (index >= 0) openStudy(index); }} />
          </ScrollView>
          {units.length ? <View style={[s.dock, { paddingBottom: Math.max(16, insets.bottom), borderTopWidth: 1, borderTopColor: palette.line }]}>
            <LearningButton label={reading.position > 0 || progress.data?.lessons.some(lesson => lesson.isStarted) ? (zh ? '继续学习' : 'Continue learning') : (zh ? '开始学习' : 'Start learning')} onPress={() => openStudy(continueIndex, true)} />
          </View> : null}
        </>}

    {practice.isPending ? <Text style={s.small}>{zh ? '正在准备练习…' : 'Preparing practice…'}</Text> : practice.isError ? <Text accessibilityRole="alert" style={s.body}>{zh ? '练习加载失败，请重试。' : 'Could not load practice. Please retry.'}</Text> : null}
    {activity.saveError ? <Text accessibilityRole="alert" style={s.small}>{zh ? '阅读位置暂时未保存，本次仍可继续学习。' : 'Reading position could not be saved. You can keep learning.'}</Text> : null}
  </View></LearningThemeContext.Provider>;
}
