import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { BookOpen, ChevronRight, RefreshCw } from '@/core/icons';
import { useAuth } from '@/contexts/AuthProvider';
import { useEducationGuidedHomeProgress, useEducationPublicCourses } from '@/features/education/hooks/useEducationPracticeItems';
import { chooseEducationHomeCourse } from '@/features/education/utils/educationHomeCourse';
import { useEducationCopy } from '@/features/education/i18n';
import { Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

export function EducationHomeLearningCard() {
  const { styles, theme } = useStyles();
  const copy = useEducationCopy();
  const router = useRouter();
  const { user } = useAuth();
  const catalog = useEducationPublicCourses('');
  const catalogItems = catalog.data ?? [];
  const homeProgress = useEducationGuidedHomeProgress();
  const course = chooseEducationHomeCourse(catalogItems, homeProgress.data ?? null);
  const courseProgress = homeProgress.data?.courseId === course?.id ? homeProgress : null;
  const catalogRef = useRef(catalog.refetch);
  const progressRef = useRef(homeProgress.refetch);
  catalogRef.current = catalog.refetch;
  progressRef.current = homeProgress.refetch;
  useFocusEffect(useCallback(() => {
    if (!user?.id || user.accountMode === 'RestrictedLearner') return;
    void catalogRef.current();
    void progressRef.current();
  }, [user?.id, user?.accountMode]));

  if (!user || user.accountMode === 'RestrictedLearner') return null;

  const openLearn = () => router.push('/(tabs)/learn' as Href);
  return <View style={styles.section}>
    <View style={styles.headingRow}>
      <Text accessibilityRole="header" style={styles.heading}>{copy.learnHomeTitle}</Text>
      <BookOpen size={18} color={theme.violetDeep} />
    </View>
    {catalog.isLoading ? <View style={styles.status}><Text style={styles.body}>{copy.loading}</Text></View>
      : catalog.isError ? <View style={styles.status}>
        <Text accessibilityRole="alert" style={styles.body}>{copy.publicCoursesError}</Text>
        <AnimatedPressable accessibilityRole="button" onPress={() => void catalog.refetch()} style={styles.retry}>
          <RefreshCw size={15} color={theme.onAccent} /><Text style={styles.retryText}>{copy.retry}</Text>
        </AnimatedPressable>
      </View>
        : !course ? <View style={styles.status}>
          <Text style={styles.body}>{copy.learnNoCourseYet}</Text>
          <LearningAction label={copy.learnHomeStart} onPress={openLearn} />
        </View>
          : <View style={styles.courseCard}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            {homeProgress.isLoading ? <Text style={styles.body}>{copy.learnHomeLoading}</Text>
              : homeProgress.isError ? <View style={styles.errorRow}>
                <Text style={styles.body}>{copy.guidedLessonLoadError}</Text>
                <AnimatedPressable accessibilityRole="button" onPress={() => void homeProgress.refetch()} style={styles.retryIcon}>
                  <RefreshCw size={17} color={theme.violetDeep} />
                </AnimatedPressable>
              </View>
                : courseProgress?.data ? <Text style={styles.body}>{courseProgress.data.lessons.length > 0
                  ? copy.guidedLessonProgress(
                    courseProgress.data.lessons.reduce((total, lesson) => total + lesson.questionsAttempted, 0),
                    courseProgress.data.lessons.reduce((total, lesson) => total + lesson.questionCount, 0),
                    courseProgress.data.lessons.reduce((total, lesson) => total + lesson.questionsSolved, 0),
                    courseProgress.data.lessons.reduce((total, lesson) => total + lesson.latestIncorrectQuestionCount, 0))
                  : copy.learnHomeDescription}</Text>
                  : <Text style={styles.body}>{copy.learnHomeDescription}</Text>}
            <LearningAction
              label={courseProgress?.data?.lessons.length && courseProgress.data.completedLessonCount >= courseProgress.data.lessons.length
                ? copy.guidedLessonReview
                : courseProgress?.data?.lessons.some(lesson => lesson.isStarted && !lesson.isComplete) ? copy.guidedLessonResume : copy.guidedLessonStart}
              onPress={() => router.push(`/community/education/${encodeURIComponent(course.id)}` as Href)}
            />
          </View>}
    <AnimatedPressable accessibilityRole="button" onPress={openLearn} style={styles.browse}>
      <Text style={styles.browseText}>{copy.learnHomeStart}</Text><ChevronRight size={17} color={theme.violetDeep} />
    </AnimatedPressable>
  </View>;
}

function LearningAction({ label, onPress }: { label: string; onPress: () => void }) {
  const { styles } = useStyles();
  return <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.action}>
    <Text style={styles.actionText}>{label}</Text>
  </AnimatedPressable>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  section: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: appRadii.card, borderWidth: 1.5, gap: 9, padding: 14 },
  headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heading: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize },
  courseCard: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1, gap: appSpacing.sm, padding: appSpacing.md },
  courseTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.cardTitle.fontSize, lineHeight: appTextStyles.cardTitle.lineHeight },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  status: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1, gap: appSpacing.sm, padding: appSpacing.md },
  errorRow: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.sm },
  retry: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 11, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 44, paddingHorizontal: appSpacing.md },
  retryIcon: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  action: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: appRadii.control, justifyContent: 'center', minHeight: 46, paddingHorizontal: 14 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
  browse: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 3, minHeight: 44, paddingHorizontal: appSpacing.xs },
  browseText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
}));
