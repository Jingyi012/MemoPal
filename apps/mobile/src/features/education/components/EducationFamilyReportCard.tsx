import type { EducationFamilyAssignmentProgress } from '@/features/education/api/educationFamilyReport.api';
import { useEducationCopy } from '@/features/education/i18n';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
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
        <Text accessibilityRole="header" style={styles.title}>{assignment.title}</Text>
        <Text style={styles.status}>{status}</Text>
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
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 1.5, gap: 7, padding: 14 },
  heading: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  title: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 15, lineHeight: 21 },
  status: { color: theme.violetDeep, fontFamily: typography.bodyBold, fontSize: 12 },
  meta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18 },
  score: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 14 },
}));
