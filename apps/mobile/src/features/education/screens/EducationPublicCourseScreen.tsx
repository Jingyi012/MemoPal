import { LearningIconButton } from '../components/LearningIconButton';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useEducationCopy } from '@/features/education/i18n';
import { LearningCourseUnits } from '../components/LearningCourseUnits';
import { LearningStudySession, type LearningReadingPosition } from '../components/LearningStudySession';
import { useIsFocused } from '@react-navigation/native';
import { studyObjectivesForLesson } from '../utils/educationObjectiveLesson';
import { LearningMemoryCard } from '../components/LearningMemoryCard';
import { LearningArrival, LearningButton, LearningProgress, LearningSkeleton, SubjectArtwork, LearningThemeContext, useLearningStyles, learningThemeFor, useLearningCopy } from '../components/LearningUi';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEducationGuidedCourseProgress, useEducationPublicCourse, useEducationPublicCourseSave, useReportEducationCourse, useStartOrResumeEducationGuidedSession } from '@/features/education/hooks/useEducationPracticeItems';
import * as Linking from 'expo-linking';
import { Stack, Href, Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Flag } from '@/core/icons';
import { Modal, Share, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useReducedMotion } from 'react-native-reanimated';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';

export default function EducationPublicCourseScreen() {
  const { courseId = '' } = useLocalSearchParams<{ courseId: string }>();
  const { styles: ls, theme: palette } = useLearningStyles();
  const copy = useEducationCopy();
  const ui = useLearningCopy();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [studyPrelude, setStudyPrelude] = useState<{ assessmentId: string; objectiveIds: string[]; index: number } | null>(null);
  const [reading, setReading] = useState<LearningReadingPosition>({ position: 0, finished: false });
  const focused = useIsFocused();
  const { styles, theme } = useStyles();
  const router = useRouter();
  const course = useEducationPublicCourse(courseId);
  const saveCourse = useEducationPublicCourseSave(courseId);
  const reportCourse = useReportEducationCourse();
  const guidedProgress = useEducationGuidedCourseProgress(courseId);
  const startGuided = useStartOrResumeEducationGuidedSession();
  const { user } = useAuth();
  const userIdRef = useRef(user?.id);
  const courseRefreshRef = useRef(course.refetch);
  const progressRefreshRef = useRef(guidedProgress.refetch);
  courseRefreshRef.current = course.refetch;
  progressRefreshRef.current = guidedProgress.refetch;
  const activeRef = useRef(false);
  const screenEpochRef = useRef(0);
  const startInFlightRef = useRef(false);
  const screenIdentity = `${courseId}:${user?.id ?? ''}:${user?.accountMode ?? ''}`;
  const screenIdentityRef = useRef(screenIdentity);
  screenIdentityRef.current = screenIdentity;
  userIdRef.current = user?.id;
  useFocusEffect(useCallback(() => {
    screenIdentityRef.current = screenIdentity;
    activeRef.current = true;
    screenEpochRef.current++;
    startInFlightRef.current = false;
    if (user?.id && user.accountMode !== 'RestrictedLearner')
      void Promise.allSettled([courseRefreshRef.current(), progressRefreshRef.current()]);
    return () => { activeRef.current = false; screenEpochRef.current++; startInFlightRef.current = false; };
  }, [screenIdentity, user?.id, user?.accountMode]));
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');

  if (user?.accountMode === 'RestrictedLearner') return <Redirect href="/education/assignments" />;

  const subjectTheme = learningThemeFor(course.data?.title ?? '', theme, course.data?.subjectCode);
  const lessons = guidedProgress.data?.lessons ?? [];
  const preludeObjective = course.data?.objectives.find(objective => objective.id === studyPrelude?.objectiveIds[studyPrelude.index]);
  const total = lessons.reduce((n, lesson) => n + lesson.questionCount, 0);
  const solved = lessons.reduce((n, lesson) => n + lesson.questionsSolved, 0);
  const nextId = guidedProgress.data?.nextRecommendedAssessmentId ?? course.data?.assessments[0]?.id;
  const memoryRecommendation = course.data?.objectives.find(objective => objective.recommendedMemorySet)?.recommendedMemorySet;
  const uncoveredAssessments = course.data?.assessments.filter(assessment => !lessons.some(lesson => lesson.assessmentId === assessment.id && lesson.objectives.some(item => course.data?.objectives.some(objective => objective.id === item.objectiveId)))) ?? [];
  const shareCourse = () => {
    setMenuOpen(false);
    const url = Linking.createURL(`community/education/${encodeURIComponent(courseId)}`);
    void Share.share({ message: `${course.data?.title}\n${copy.sharePublicCourseOpenLink}: ${url}`, title: copy.sharePublicCourseTitle }).catch(() => Toast.show({ type: 'error', text1: copy.sharePublicCourseError }));
  };
  return <LearningThemeContext.Provider value={subjectTheme}><View style={ls.page}>
    <Stack.Screen options={{ animation: reduceMotion ? 'none' : 'fade_from_bottom' }} />
    <CommonHeader title={ui.zh ? '课程' : 'Course'} showAiCredits={false} backAction={() => router.back()} actions={[
      { component: <AnimatedPressable accessibilityLabel={course.data?.isSaved ? copy.unsavePublicCourse : copy.savePublicCourse} disabled={saveCourse.isPending || !course.data} onPress={() => saveCourse.mutate(!course.data?.isSaved)} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}><Ionicons name={course.data?.isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color={subjectTheme.color} /></AnimatedPressable> },
      { component: <AnimatedPressable accessibilityLabel={ui.more} onPress={() => setMenuOpen(true)} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="ellipsis-horizontal" size={24} color={theme.ink} /></AnimatedPressable> },
    ]} />
    <ScrollView contentContainerStyle={ls.content}>
      {course.isLoading ? <LearningSkeleton />
        : course.isError || !course.data ? <View style={styles.errorState}>
          <Text accessibilityRole="alert" style={styles.body}>{copy.publicCoursesError}</Text>
          <AnimatedPressable accessibilityRole="button" onPress={() => void course.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>{copy.retry}</Text>
          </AnimatedPressable>
        </View>
          : <>
            <LearningArrival><LinearGradient colors={palette.hero as [string, string]} start={[0, 0]} end={[1, 1]} style={ls.courseHero}>
              <View style={{ position: 'absolute', right: 12, top: 10 }}><SubjectArtwork theme={subjectTheme} size={60} /></View>
              <View style={{ paddingRight: 64, gap: 4 }}><Text numberOfLines={2} accessibilityRole="header" style={[ls.title, { color: palette.heroInk }]}>{course.data.title}</Text><Text style={[ls.small, { color: palette.heroInk }]}>{copy.publicCourseAuthor(course.data.authorDisplayName)} · {guidedProgress.isLoading ? '…' : guidedProgress.isError ? '—' : ui.correct(solved, total)}</Text></View>
              <LearningProgress value={solved} total={total} color={palette.heroInk} />
            </LinearGradient></LearningArrival>
            {saveCourse.isError ? <Text accessibilityRole="alert" style={styles.saveError}>{copy.savePublicCourseError}</Text> : null}
            <AnimatedPressable accessibilityState={{ expanded: noteOpen }} onPress={() => setNoteOpen(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={ls.small}>ⓘ {ui.note} {noteOpen ? '−' : '+'}</Text></AnimatedPressable>
            {noteOpen ? <View style={ls.card}><Text style={ls.body}>{copy.publicCoursePracticeNote}</Text>{course.data.isMemoPalStarter ? <Text style={ls.small}>{copy.starterCourseLanguageNote}</Text> : null}</View> : null}
            <LearningCourseUnits course={course.data} progress={guidedProgress.data} onMemory={id => router.push(`/community/education/${encodeURIComponent(courseId)}/memory?memorySetId=${encodeURIComponent(id)}` as Href)} onPractice={(assessmentId, studiedObjectiveId) => void openGuidedLesson(assessmentId, false, studiedObjectiveId)} />
            {memoryRecommendation ? <LearningMemoryCard title={ui.zh ? '用记忆宫殿记住它' : 'Make it memorable'} description={memoryRecommendation.title} label={ui.zh ? '选择记忆法' : 'Choose a memory method'} onPress={() => router.push(`/community/education/${encodeURIComponent(courseId)}/memory?memorySetId=${encodeURIComponent(memoryRecommendation.id)}` as Href)} /> : null}
            {uncoveredAssessments.length ? <Text accessibilityRole="header" style={ls.heading}>{ui.lessons}</Text> : null}
            {guidedProgress.isError ? <AnimatedPressable onPress={() => void guidedProgress.refetch()} style={ls.card}><Text accessibilityRole="alert" style={ls.body}>{copy.guidedLessonLoadError} · {copy.retry}</Text></AnimatedPressable> : null}
            {startGuided.isError ? <Text accessibilityRole="alert" style={styles.saveError}>{copy.guidedLessonSessionError}</Text> : null}
            {uncoveredAssessments.map(assessment => {
              const lesson = lessons.find(item => item.assessmentId === assessment.id);
              return <AnimatedPressable key={assessment.id} disabled={startGuided.isPending} onPress={() => void openGuidedLesson(assessment.id)} style={[ls.card, { borderColor: subjectTheme.line }]}>
                <View style={ls.row}><Ionicons name={lesson?.isComplete ? 'checkmark-circle' : 'play-circle-outline'} size={28} color={subjectTheme.color} /><Text style={[ls.heading, { flex: 1 }]}>{assessment.title}</Text><Ionicons name="chevron-forward" size={20} color={subjectTheme.color} /></View>
                <Text style={ls.body}>{ui.correct(lesson?.questionsSolved ?? 0, assessment.questionCount)} · {ui.time(assessment.questionCount)}</Text>
                {lesson?.latestIncorrectQuestionCount ? <View style={ls.badge}><Text style={ls.small}>{ui.reinforce}</Text></View> : null}
              </AnimatedPressable>;
            })}
          </>}
    </ScrollView>
    {nextId && course.data ? <View style={[ls.dock, { paddingBottom: Math.max(16, insets.bottom) }]}><LearningButton label={lessons.length > 0 && lessons.every(lesson => lesson.isComplete) ? copy.guidedLessonReview : ui.continue} loading={startGuided.isPending} onPress={() => void openGuidedLesson(nextId)} /></View> : null}
    <Modal visible={focused && !!studyPrelude && !!preludeObjective} animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={() => setStudyPrelude(null)}>
      <View style={[ls.page, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[ls.row, { padding: 18 }]}>
          {reading.finished ? <LearningIconButton icon="close" label={ui.close} onPress={() => setStudyPrelude(null)} /> : null}
          <Text accessibilityRole="header" style={[ls.heading, { flex: 1 }]}>{preludeObjective?.title}</Text>
          {!reading.finished ? <LearningIconButton variant="plain" icon="close" label={ui.close} onPress={() => setStudyPrelude(null)} /> : null}
        </View>
        {studyPrelude && preludeObjective ? <LearningStudySession key={preludeObjective.id} objective={preludeObjective}
          reading={reading} onReadingChange={setReading}
          practiceQuestionCount={lessons.find(lesson => lesson.assessmentId === studyPrelude.assessmentId)?.questionCount}
          practiceTitle={lessons.find(lesson => lesson.assessmentId === studyPrelude.assessmentId)?.assessmentTitle}
          finishLabel={studyPrelude.index < studyPrelude.objectiveIds.length - 1 ? (ui.zh ? '学习下一个知识点' : 'Discover the next study point') : undefined}
          onFinish={() => {
            if (studyPrelude.index < studyPrelude.objectiveIds.length - 1) { setReading({ position: 0, finished: false }); setStudyPrelude({ ...studyPrelude, index: studyPrelude.index + 1 }); }
            else { setStudyPrelude(null); void openGuidedLesson(studyPrelude.assessmentId, true); }
          }}
          onMemory={id => router.push(`/community/education/${encodeURIComponent(courseId)}/memory?memorySetId=${encodeURIComponent(id)}` as Href)} /> : null}
      </View>
    </Modal>
    <Modal transparent visible={menuOpen} animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => setMenuOpen(false)}>
      <View style={{ flex: 1, backgroundColor: palette.scrim, justifyContent: 'flex-end', padding: 20, paddingBottom: Math.max(20, insets.bottom) }}><View style={ls.card}>
        <LearningButton secondary label={copy.sharePublicCourse} onPress={shareCourse} />
        <LearningButton secondary label={copy.reportPublicCourse} onPress={() => { setMenuOpen(false); setReportOpen(true); }} />
        <LearningButton secondary label={ui.close} onPress={() => setMenuOpen(false)} />
      </View></View>
    </Modal>
    {course.data ? <ConfirmModal
      visible={reportOpen}
      icon={<Flag size={25} color={theme.berryDeep} />}
      title={copy.reportPublicCourseTitle}
      subject={course.data.title}
      description={copy.reportPublicCourseDescription}
      confirmText={copy.reportPublicCourseConfirm}
      cancelText={copy.cancel}
      isLoading={reportCourse.isPending}
      onCancel={() => setReportOpen(false)}
      onConfirm={() => reportCourse.mutate({ courseId, reason: reportReason, details: reportDetails.trim() || undefined }, {
        onSuccess: () => {
          setReportOpen(false);
          setReportDetails('');
          Toast.show({ type: 'success', text1: copy.reportPublicCourseThanks });
        },
        onError: () => Toast.show({ type: 'error', text1: copy.reportPublicCourseError }),
      })}
    >
      <View style={styles.reportReasons}>
        {([
          ['incorrect', copy.reportPublicCourseReasonIncorrect],
          ['inappropriate', copy.reportPublicCourseReasonInappropriate],
          ['personal-info', copy.reportPublicCourseReasonPrivacy],
          ['copyright', copy.reportPublicCourseReasonCopyright],
          ['spam', copy.reportPublicCourseReasonSpam],
          ['other', copy.reportPublicCourseReasonOther],
        ] as const).map(([reason, label]) => <AnimatedPressable
          key={reason}
          accessibilityRole="radio"
          accessibilityState={{ checked: reportReason === reason }}
          onPress={() => setReportReason(reason)}
          style={[styles.reportReason, reportReason === reason && styles.reportReasonSelected]}
        ><Text style={[styles.reportReasonText, reportReason === reason && styles.reportReasonTextSelected]}>{label}</Text></AnimatedPressable>)}
        <TextInput
          accessibilityLabel={copy.reportPublicCourseDetails}
          value={reportDetails}
          onChangeText={value => setReportDetails(value.slice(0, 500))}
          placeholder={copy.reportPublicCourseDetails}
          placeholderTextColor={theme.inkSoft}
          multiline
          maxLength={500}
          style={styles.reportDetailsInput}
        />
      </View>
    </ConfirmModal> : null}
  </View></LearningThemeContext.Provider>;

  async function openGuidedLesson(assessmentId: string, skipStudy = false, studiedObjectiveId?: string) {
    const userId = user?.id;
    if (!userId || startGuided.isPending || startInFlightRef.current) return;
    const lesson = lessons.find(item => item.assessmentId === assessmentId);
    if (!skipStudy && lesson && !lesson.isStarted) {
      const objectiveIds = studyObjectivesForLesson(course.data?.objectives ?? [], lesson, studiedObjectiveId);
      if (objectiveIds.length) { setReading({ position: 0, finished: false }); setStudyPrelude({ assessmentId, objectiveIds, index: 0 }); return; }
    }
    startInFlightRef.current = true;
    const epoch = screenEpochRef.current;
    const identity = screenIdentityRef.current;
    try {
      const session = await startGuided.mutateAsync({ courseId, assessmentId });
      if (!activeRef.current || screenEpochRef.current !== epoch || screenIdentityRef.current !== identity) return;
      if (userIdRef.current !== userId) { startInFlightRef.current = false; return; }
      router.push(`/community/education/guided/${encodeURIComponent(session.sessionId)}` as Href);
    } catch {
      if (activeRef.current && screenEpochRef.current === epoch && userIdRef.current === userId) {
        startInFlightRef.current = false;
        Toast.show({ type: 'error', text1: copy.guidedLessonSessionError });
      }
    }
  }
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 12, padding: 18, paddingBottom: 36 },
  state: { minHeight: 120, justifyContent: 'center', overflow: 'hidden' },
  author: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  saveButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.paper, borderColor: theme.violetDeep, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15 },
  shareButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15 },
  saveButtonText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  reportButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 44, paddingHorizontal: 5 },
  reportText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  reportReasons: { alignSelf: 'stretch', gap: 7, marginTop: 14 },
  reportReason: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 12, borderWidth: 1, minHeight: 40, justifyContent: 'center', paddingHorizontal: 10 },
  reportReasonSelected: { backgroundColor: theme.berryTint, borderColor: theme.berryLine },
  reportReasonText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12 },
  reportReasonTextSelected: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold },
  reportDetailsInput: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 12, borderWidth: 1, color: theme.ink, fontSize: 13, minHeight: 74, padding: 10, textAlignVertical: 'top' },
  savedNote: { color: theme.successText, fontFamily: typography.bodyBold, fontSize: 12 },
  saveError: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 12 },
  notice: { backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: 15, borderWidth: 1.5, color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19, padding: 14 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17, marginTop: 6 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 20 },
  objective: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 15, borderWidth: 1, gap: 8, padding: 12 },
  studyItem: { borderTopColor: theme.line, borderTopWidth: 1, gap: 4, paddingTop: 9 },
  studyDetail: { color: theme.violetDeep, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 18 },
  objectiveTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  errorState: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 1.5, gap: 10, padding: 15 },
  retry: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15 },
  retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  progressError: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: 14, borderWidth: 1, gap: 8, padding: 12 },
  lessonCard: { backgroundColor: theme.mintTint, borderColor: theme.mintLine, borderRadius: 18, borderWidth: 1.5, gap: 8, padding: 10 },
  lessonProgress: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, paddingHorizontal: 3 },
  recommended: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12, paddingHorizontal: 3 },
  lessonAction: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: 13, justifyContent: 'center', minHeight: 46, paddingHorizontal: 16 },
  lessonActionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
