import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import { useReducedMotion } from 'react-native-reanimated';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { LearningCoursePath } from '../components/LearningCoursePath';
import { LearningArrival, LearningButton, LearningProgress, LearningSkeleton, LearningThemeContext, SubjectArtwork, learningThemeFor, useLearningStyles, useLearningCopy } from '../components/LearningUi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEducationClassroomLearningContent, useEducationGuidedCourseProgress, useStartOrResumeEducationGuidedSession } from '@/features/education/hooks/useEducationPracticeItems';
import { useEducationCopy } from '@/features/education/i18n';
import { useAuth } from '@/contexts/AuthProvider';
import { Stack, Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function EducationClassroomCourseScreen() {
  const { classroomId = '', courseId = '' } = useLocalSearchParams<{ classroomId: string; courseId: string }>();
  const copy = useEducationCopy();
  const reduceMotion = useReducedMotion();
  const ui = useLearningCopy();
  const { styles: ls } = useLearningStyles();
  const insets = useSafeAreaInsets();
  const { styles, theme } = useStyles();
  const { user } = useAuth();
  const router = useRouter();
  const progress = useEducationGuidedCourseProgress(courseId, classroomId);
  const start = useStartOrResumeEducationGuidedSession();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [refreshingFor, setRefreshingFor] = useState<string | null>(null);
  const startGateRef = useRef(false);
  const focusedRef = useRef(false);
  const epochRef = useRef(0);
  const identity = `${user?.id ?? ''}:${classroomId}:${courseId}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const refreshQueriesRef = useRef<() => void>(() => undefined);
  const lessons = progress.data?.lessons ?? [];
  const selected = lessons.find(lesson => lesson.assessmentId === selectedAssessmentId) ?? lessons[0] ?? null;
  const intro = useEducationClassroomLearningContent(classroomId, courseId, selected?.assessmentId ?? null);
  refreshQueriesRef.current = () => {
    const requestIdentity = identity;
    setRefreshingFor(requestIdentity);
    const refreshes = selected
      ? [progress.refetch(), intro.refetch()]
      : [progress.refetch()];
    void Promise.all(refreshes).finally(() => {
      if (identityRef.current === requestIdentity) setRefreshingFor(null);
    });
  };
  useFocusEffect(useCallback(() => {
    const focusedIdentity = identity;
    if (focusedIdentity !== identityRef.current) { epochRef.current++; startGateRef.current = false; }
    focusedRef.current = true;
    epochRef.current++;
    startGateRef.current = false;
    refreshQueriesRef.current();
    return () => { focusedRef.current = false; epochRef.current++; startGateRef.current = false; };
  }, [identity]));

  const openLesson = async () => {
    if (!selected || !user?.id || !focusedRef.current || startGateRef.current || refreshingFor === identity || progress.isError || intro.isError) return;
    startGateRef.current = true;
    const epoch = epochRef.current;
    const requestIdentity = identity;
    try {
      const session = await start.mutateAsync({ classroomId, courseId, assessmentId: selected.assessmentId });
      if (!focusedRef.current || epoch !== epochRef.current || identityRef.current !== requestIdentity || !user?.id) return;
      void progress.refetch();
      router.push(`/education/classrooms/${encodeURIComponent(classroomId)}/guided/${encodeURIComponent(session.sessionId)}` as Href);
    } catch {
      if (epoch === epochRef.current && focusedRef.current) startGateRef.current = false;
    }
  };

  const subject = learningThemeFor(progress.data?.courseTitle ?? '', theme);
  const total = lessons.reduce((n, lesson) => n + lesson.questionCount, 0);
  const solved = lessons.reduce((n, lesson) => n + lesson.questionsSolved, 0);
  return <LearningThemeContext.Provider value={subject}><View style={ls.page}>
    <Stack.Screen options={{ animation: reduceMotion ? 'none' : 'fade_from_bottom' }} />
    <CommonHeader title={progress.data?.courseTitle ?? copy.classroomLearning} backAction={() => router.back()} />
    <ScrollView contentContainerStyle={ls.content}>
      {progress.isLoading || refreshingFor === identity ? <LearningSkeleton />
        : progress.isError || !progress.data ? <View style={styles.notice}>
          <Text accessibilityRole="alert" style={styles.body}>{copy.classroomLearningLoadError}</Text>
          <AnimatedPressable accessibilityRole="button" onPress={() => void progress.refetch()} style={styles.action}><Text style={styles.actionText}>{copy.retry}</Text></AnimatedPressable>
        </View>
          : <>
            <LearningArrival style={ls.card}><View style={ls.row}><SubjectArtwork theme={subject} /><View style={{ flex: 1, gap: 6 }}><Text numberOfLines={1} style={ls.title}>{progress.data.courseTitle}</Text><Text style={ls.body}>{ui.correct(solved, total)}</Text></View></View><LearningProgress value={solved} total={total} /></LearningArrival>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{copy.classroomLearningLessons}</Text>
            {lessons.length === 0 ? <Text style={styles.body}>{copy.classroomLearningNoLessons}</Text> : lessons.map(lesson => {
              const active = selected?.assessmentId === lesson.assessmentId;
              return <AnimatedPressable key={lesson.assessmentId} accessibilityRole="button" accessibilityState={{ selected: active }}
                disabled={start.isPending || startGateRef.current}
                onPress={() => { if (!start.isPending && !startGateRef.current) setSelectedAssessmentId(lesson.assessmentId); }}
                style={[styles.lesson, active && styles.selectedLesson, (start.isPending || startGateRef.current) && styles.disabledLesson]}>
                <Text style={styles.lessonTitle}>{lesson.assessmentTitle}</Text>
                <Text style={styles.body}>{ui.correct(lesson.questionsSolved, lesson.questionCount)}</Text>
                <Text style={styles.status}>{lesson.isComplete ? copy.guidedLessonReview : lesson.isStarted ? copy.guidedLessonResume : copy.guidedLessonStart}</Text>
              </AnimatedPressable>;
            })}
            {selected ? <>
              {intro.isLoading ? <LearningSkeleton /> : intro.isError || !intro.data ? <View style={ls.card}><Text accessibilityRole="alert" style={ls.body}>{copy.classroomLearningIntroError}</Text><LearningButton secondary label={copy.retry} onPress={() => void intro.refetch()} /></View>
                : <LearningCoursePath objectives={intro.data.objectives.map(objective => ({ id: objective.objectiveId, title: objective.title, studyItems: objective.studyItems, recommendedMemorySet: null }))} progress={progress.data} onMemory={() => undefined} onPractice={() => void openLesson()} />}
              {start.isError ? <Text accessibilityRole="alert" style={styles.error}>{copy.guidedLessonSessionError}</Text> : null}
            </> : null}
          </>}
    </ScrollView>
    {selected && !progress.isError ? <View style={[ls.dock, { paddingBottom: Math.max(16, insets.bottom) }]}><LearningButton label={ui.continue} loading={start.isPending} disabled={start.isPending || refreshingFor === identity || intro.isLoading || intro.isError} onPress={() => void openLesson()} /></View> : null}
  </View></LearningThemeContext.Provider>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: appSpacing.md, padding: 18, paddingBottom: 36 },
  state: { minHeight: 120, justifyContent: 'center', overflow: 'hidden' },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, marginTop: 6 },
  lesson: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 2, borderBottomWidth: 5, gap: appSpacing.sm, padding: appSpacing.lg },
  selectedLesson: { borderColor: theme.violetDeep, borderWidth: 2 },
  disabledLesson: { opacity: 0.65 },
  lessonTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
  status: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  note: { backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: appRadii.control, borderWidth: 1, color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, padding: 11 },
  objective: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1, gap: appSpacing.sm, padding: appSpacing.md },
  objectiveTitle: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
  item: { borderTopColor: theme.line, borderTopWidth: 1, gap: 3, paddingTop: appSpacing.sm },
  itemPrimary: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  inline: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.sm },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: appRadii.control, borderWidth: 1, gap: appSpacing.sm, padding: appSpacing.md },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: appRadii.control, justifyContent: 'center', minHeight: 45, paddingHorizontal: 15 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
  error: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize },
}));
