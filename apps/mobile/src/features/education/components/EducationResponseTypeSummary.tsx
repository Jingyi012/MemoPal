import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import type { EducationQuestionTypePerformance } from '@/features/education/api/educationFamilyReport.api';
import { useEducationCopy } from '@/features/education/i18n';
import { StyleSheet, Text, View } from 'react-native';

type EducationResponseTypeSummaryProps = Readonly<{
  selectedResponse: EducationQuestionTypePerformance;
  openResponse: EducationQuestionTypePerformance;
}>;

export function EducationResponseTypeSummary({ selectedResponse, openResponse }: EducationResponseTypeSummaryProps) {
  const copy = useEducationCopy();
  const { styles } = useStyles();
  const rows = [
    [copy.familySelectedResponse, selectedResponse],
    [copy.familyOpenResponse, openResponse],
  ] as const;
  const scoredRows = rows.filter(([, performance]) => performance.score !== null && performance.maxScore !== null);
  if (scoredRows.length === 0) return null;

  return (
    <View style={styles.container}>
      {scoredRows.map(([label, performance]) => (
        <Text key={label} style={styles.row}>
          {label}: {copy.familyPerformance(performance.score!, performance.maxScore!, performance.percentage, performance.distinctQuestionCount)}
        </Text>
      ))}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  container: { gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.line },
  row: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 22 },
}));
