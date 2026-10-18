import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { MyEducationAssignment } from '../types/educationAssignment.types';
import { EducationAssignmentCard } from './EducationAssignmentCard';
import { StyleSheet, Text, View } from 'react-native';

type EducationCourseAssignmentGroupProps = Readonly<{
  courseTitle: string | null;
  assignments: readonly MyEducationAssignment[];
  onOpen: (assignment: MyEducationAssignment) => void;
}>;

export function EducationCourseAssignmentGroup({ courseTitle, assignments, onOpen }: EducationCourseAssignmentGroupProps) {
  const { styles } = useStyles();
  return (
    <View style={styles.course}>
      {courseTitle ? <Text accessibilityRole="header" style={styles.title}>{courseTitle}</Text> : null}
      <View style={styles.assignments}>
        {assignments.map(assignment => (
          <EducationAssignmentCard key={assignment.id} assignment={assignment} onPress={() => onOpen(assignment)} />
        ))}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  course: { gap: 8 },
  title: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  assignments: { gap: 9 },
}));
