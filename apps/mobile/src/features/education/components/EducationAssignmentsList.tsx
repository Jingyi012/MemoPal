import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import { ArrowRight } from '@/core/icons';
import type { MyEducationAssignment } from '@/features/education/types/educationAssignment.types';
import { useEducationCopy } from '@/features/education/i18n';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { groupEducationAssignmentsByCourse } from '../utils/groupEducationAssignmentsByCourse';
import { EducationCourseAssignmentGroup } from './EducationCourseAssignmentGroup';

type EducationAssignmentsListProps = Readonly<{
  assignments: readonly MyEducationAssignment[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onOpen: (assignment: MyEducationAssignment) => void;
}>;

export function EducationAssignmentsList({
  assignments,
  isLoading,
  isError,
  onRetry,
  onOpen,
}: EducationAssignmentsListProps) {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const courses = groupEducationAssignmentsByCourse(assignments);

  // The Home screen is shared by all players, not just classroom learners.
  // Keep the task workspace contextual: show it when there is work, while
  // preserving loading and error states so assigned learners can recover.
  if (!isLoading && !isError && assignments.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>{copy.title}</Text>
      {isLoading ? (
        <View style={styles.state}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.stateText}>{copy.loading}</Text></View>
      ) : isError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{copy.loadErrorTitle}</Text>
          <Text style={styles.noticeBody}>{copy.loadErrorBody}</Text>
          <AnimatedPressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
            <Text style={styles.retryText}>{copy.retry}</Text>
            <ArrowRight size={15} color={theme.onSun} />
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.courses}>
          {courses.map(course => (
            <EducationCourseAssignmentGroup key={course.courseId ?? course.assignments[0]?.id} courseTitle={course.courseTitle}
              assignments={course.assignments} onOpen={onOpen} />
          ))}
        </View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  section: { gap: 9 },
  heading: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16 },
  courses: { gap: 16 },
  state: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: 16, flexDirection: 'row', gap: 10, minHeight: 62, paddingHorizontal: 15 },
  stateText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13 },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: 16, borderWidth: 1.5, padding: 14 },
  noticeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  noticeBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 18, marginTop: 3 },
  retry: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 12, flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 10, minHeight: 44, paddingHorizontal: 13 },
  retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
