import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import type { EducationFamilyAssignmentProgress } from '@/features/education/api/educationFamilyReport.api';
import { useEducationCopy } from '@/features/education/i18n';
import { StyleSheet, View } from 'react-native';
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
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.hero, borderWidth: 1, borderBottomWidth: 2, gap: 14, padding: 18 },
  heading: { alignItems: 'flex-start', gap: 10 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize, lineHeight: appTextStyles.screenTitle.lineHeight },
  status: { color: theme.violetDeep, backgroundColor: theme.violetTint, borderRadius: appRadii.control, paddingVertical: 6, paddingHorizontal: 10, overflow: 'hidden', fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
  meta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  score: { color: theme.successText, backgroundColor: theme.mintTint, padding: 14, borderRadius: appRadii.control, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize, lineHeight: appTextStyles.screenTitle.lineHeight },
}));
