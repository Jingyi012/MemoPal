import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { useEducationCopy } from '@/features/education/i18n';
import { EducationFamilyReportCard } from '@/features/education/components/EducationFamilyReportCard';
import { useEducationFamilyChildren, useEducationFamilyReport } from '@/features/education/hooks/useEducationFamilyReports';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function EducationFamilyReportsScreen() {
  const copy = useEducationCopy();
  const router = useRouter();
  const { styles, theme } = useStyles();
  const children = useEducationFamilyChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string>();
  const selectedChild = children.data?.find(child => child.studentUserId === selectedStudentId) ?? children.data?.[0];
  const report = useEducationFamilyReport(selectedChild?.studentUserId);

  return (
    <View style={styles.page}>
      <CommonHeader title={copy.familyReportTitle} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {children.isPending ? (
          <View style={styles.state}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.body}>{copy.loading}</Text></View>
        ) : children.isError ? (
          <View style={styles.notice}><Text accessibilityRole="alert" style={styles.body}>{copy.familyLoadError}</Text><RetryButton label={copy.retry} onPress={() => void children.refetch()} /></View>
        ) : !children.data?.length ? (
          <View style={styles.notice}><Text style={styles.body}>{copy.familyNoChildren}</Text></View>
        ) : (
          <>
            <Text style={styles.description}>{copy.familyReportsDescription}</Text>
            <View style={styles.childList}>
              {children.data.map(child => {
                const selected = child.studentUserId === selectedChild?.studentUserId;
                return <AnimatedPressable key={child.studentUserId} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setSelectedStudentId(child.studentUserId)} style={[styles.childChip, selected && styles.childChipSelected]}>
                  <Text style={[styles.childName, selected && styles.childNameSelected]}>{child.studentName}</Text>
                </AnimatedPressable>;
              })}
            </View>
            {report.isPending ? <View style={styles.state}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.body}>{copy.loading}</Text></View> : null}
            {report.isError ? <View style={styles.notice}><Text accessibilityRole="alert" style={styles.body}>{copy.familyLoadError}</Text><RetryButton label={copy.retry} onPress={() => void report.refetch()} /></View> : null}
            {report.data ? <>
              <View style={styles.summary}>
                <Summary label={copy.familyAssignmentCount(report.data.assignmentCount)} styles={styles} />
                <Summary label={copy.familyNotStarted(report.data.notStartedCount)} styles={styles} />
                <Summary label={copy.familyInProgress(report.data.inProgressCount)} styles={styles} />
                <Summary label={copy.familySubmitted(report.data.submittedCount)} styles={styles} />
                <Summary label={copy.familyPublished(report.data.publishedResultCount)} styles={styles} />
              </View>
              {report.data.assignments.length ? report.data.assignments.map(assignment => <EducationFamilyReportCard key={assignment.assignmentId} assignment={assignment} />)
                : <View style={styles.notice}><Text style={styles.body}>{copy.familyNoAssignments}</Text></View>}
            </> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Summary({ label, styles }: { label: string; styles: ReturnType<typeof useStyles>['styles'] }) {
  return <View style={styles.summaryItem}><Text style={styles.summaryText}>{label}</Text></View>;
}

function RetryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { styles } = useStyles();
  return <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.retry}><Text style={styles.retryText}>{label}</Text></AnimatedPressable>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 12, padding: 20, paddingBottom: 36 },
  description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 20 },
  childList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  childChip: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 999, borderWidth: 1.5, minHeight: 44, justifyContent: 'center', paddingHorizontal: 15 },
  childChipSelected: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  childName: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 13 },
  childNameSelected: { color: theme.violetDeep },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  summaryItem: { backgroundColor: theme.skyTint, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8 },
  summaryText: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 12 },
  state: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 50 },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: 15, borderWidth: 1.5, gap: 7, padding: 14 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 20 },
  retry: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 11, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  retryText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
