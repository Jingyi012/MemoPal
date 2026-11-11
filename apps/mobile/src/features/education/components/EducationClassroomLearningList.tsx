import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { educationRelationshipApi } from '@/features/education/api/educationRelationship.api';
import { useEducationCopy } from '@/features/education/i18n';
import { useAuth } from '@/contexts/AuthProvider';
import type { EducationClassroomMembership } from '@/features/education/types/educationRelationship.types';
import { createEducationClassroomCoursesQueryKey, getActiveStudentClassroomsForUser } from '@/features/education/utils/educationClassroomLearning';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EducationClassroomCourseCard } from './EducationClassroomCourseCard';

type Props = Readonly<{ memberships: readonly EducationClassroomMembership[]; isLoading: boolean; isError: boolean; onRetry: () => void }>;

export function EducationClassroomLearningList({ memberships, isLoading, isError, onRetry }: Props) {
  const copy = useEducationCopy();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { styles, theme } = useStyles();
  const classrooms = getActiveStudentClassroomsForUser(memberships, user?.id);
  const refreshMembershipsRef = useRef(onRetry);
  refreshMembershipsRef.current = onRetry;
  useFocusEffect(useCallback(() => {
    refreshMembershipsRef.current();
    void queryClient.invalidateQueries({ queryKey: ['education', 'guided-learning', user?.id ?? 'anonymous', 'classroom-courses'] });
  }, [queryClient, user?.id]));
  const results = useQueries({ queries: classrooms.map(classroom => ({
    queryKey: createEducationClassroomCoursesQueryKey(user?.id ?? 'anonymous', classroom.classroomId),
    queryFn: () => educationRelationshipApi.getClassroomCourses(classroom.classroomId),
    staleTime: 30_000,
    retry: false,
  })) });

  return <View style={styles.section}>
    <View style={styles.inline}><Ionicons name="school-outline" size={24} color={theme.violetDeep} /><Text accessibilityRole="header" style={[styles.sectionTitle, { flex: 1 }]}>{copy.classroomLearning}</Text></View>
    {isLoading ? <View style={styles.inline}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.body}>{copy.loading}</Text></View>
      : isError ? <View style={styles.notice}><Text style={styles.body}>{copy.classroomLearningLoadError}</Text>
        <AnimatedPressable accessibilityRole="button" onPress={onRetry} style={styles.action}><Text style={styles.actionText}>{copy.retry}</Text></AnimatedPressable></View>
        : classrooms.length === 0 ? <View style={styles.empty}><Ionicons name="people-outline" size={32} color={theme.violetDeep} /><Text style={[styles.body, { flex: 1 }]}>{copy.classroomLearningNoMemberships}</Text></View>
          : classrooms.map((classroom, index) => {
            const courses = results[index];
            return <View key={classroom.classroomId} style={styles.classroom}>
              <Text style={styles.classroomTitle}>{classroom.classroomName ?? copy.classroomNameUnavailable}</Text>
              {courses.isLoading ? <Text style={styles.body}>{copy.loading}</Text>
                : courses.isError ? <View style={styles.notice}><Text style={styles.body}>{copy.classroomLearningLoadError}</Text>
                  <AnimatedPressable accessibilityRole="button" onPress={() => void courses.refetch()} style={styles.action}><Text style={styles.actionText}>{copy.retry}</Text></AnimatedPressable></View>
                  : courses.data?.length === 0 ? <Text style={styles.body}>{copy.classroomLearningNoCourses}</Text>
                    : courses.data?.map(course => <EducationClassroomCourseCard key={course.courseId} course={course} onOpen={() => router.push(
                      `/education/classrooms/${encodeURIComponent(classroom.classroomId)}/courses/${encodeURIComponent(course.courseId)}` as Href)} />)}
              {index < classrooms.length - 1 ? <View style={styles.divider} /> : null}
            </View>;
          })}
  </View>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  section: { gap: appSpacing.lg, paddingVertical: appSpacing.sm },
  empty: { backgroundColor: theme.violetTint, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 2, padding: 18, gap: appSpacing.md, flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize },
  classroom: { gap: 14 },
  classroomTitle: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  inline: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.sm },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: appRadii.control, borderWidth: 1, gap: 6, padding: 10 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 10, justifyContent: 'center', minHeight: 44, paddingHorizontal: 13 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  divider: { backgroundColor: theme.line, height: 1, marginVertical: 2 },
}));
