import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import type { EducationFamilyAssignmentProgress } from '@/features/education/api/educationFamilyReport.api';
import { useEducationCopy } from '@/features/education/i18n';
import { StyleSheet, Text, View } from 'react-native';
import { EducationResponseTypeSummary } from './EducationResponseTypeSummary';

export function EducationFamilyReportCard({ assignment }: { assignment: EducationFamilyAssignmentProgress }) {
  const copy = useEducationCopy();
  const { styles } = useStyles();
  const locale = copy.locale;
  const dueAt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(assignment.dueAt));
  const status = assignment.status === 'in-progress' ? copy.familyInProgressStatus
    : assignment.status === 'submitted' ? copy.familySubmittedStatus
      : copy.familyNotStartedStatus;

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.status}>{status}</Text>
        <Text accessibilityRole="header" style={styles.title}>{assignment.title}</Text>
      </View>
      <Text style={styles.meta}>{copy.familyDue}: {dueAt}</Text>
      {assignment.resultPublished && assignment.score !== null && assignment.maxScore !== null ? (
        <>
          <Text style={styles.score}>{copy.publishedScore(assignment.score, assignment.maxScore)}</Text>
          <EducationResponseTypeSummary
            selectedResponse={assignment.selectedResponsePerformance}
            openResponse={assignment.openResponsePerformance}
          />
        </>
      ) : assignment.status === 'submitted' ? (
        <Text style={styles.meta}>{copy.submittedBody}</Text>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 24, borderWidth: 1, borderBottomWidth: 2, gap: 14, padding: 18 },
  heading: { alignItems: 'flex-start', gap: 10 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19, lineHeight: 26 },
  status: { color: theme.violetDeep, backgroundColor: theme.violetTint, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, overflow: 'hidden', fontFamily: typography.bodyBold, fontSize: 12 },
  meta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18 },
  score: { color: theme.successText, backgroundColor: theme.mintTint, padding: 14, borderRadius: 16, fontFamily: typography.displayExtraBold, fontSize: 20, lineHeight: 28 },
}));
