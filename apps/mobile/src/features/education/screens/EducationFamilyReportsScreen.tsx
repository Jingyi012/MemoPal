import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { useEducationCopy } from '@/features/education/i18n';
import { EducationFamilyReportCard } from '@/features/education/components/EducationFamilyReportCard';
import { useEducationFamilyChildren, useEducationFamilyReport } from '@/features/education/hooks/useEducationFamilyReports';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { LearningSkeleton, useLearningCopy } from '../components/LearningUi';

export default function EducationFamilyReportsScreen() {
  const copy = useEducationCopy();
  const router = useRouter();
  const { styles, theme } = useStyles();
  const { zh } = useLearningCopy();
  const children = useEducationFamilyChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string>();
  const selectedChild = children.data?.find(child => child.studentUserId === selectedStudentId) ?? children.data?.[0];
  const report = useEducationFamilyReport(selectedChild?.studentUserId);

  return (
    <View style={styles.page}>
      <CommonHeader title={copy.familyReportTitle} showAiCredits={false} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {children.isPending ? (
          <LearningSkeleton />
        ) : children.isError ? (
          <View style={styles.notice}><Text accessibilityRole="alert" style={styles.body}>{copy.familyLoadError}</Text><RetryButton label={copy.retry} onPress={() => void children.refetch()} /></View>
        ) : !children.data?.length ? (
          <View style={styles.notice}><Text style={styles.body}>{copy.familyNoChildren}</Text></View>
        ) : (
          <>
            <LinearGradient colors={theme.hero as [string, string]} start={[0, 0]} end={[1, 1]} style={styles.hero}>
              <Ionicons name="heart-outline" size={30} color={theme.heroInk} />
              <Text style={styles.heroTitle}>{zh ? '看见每一点进步' : 'See every little step'}</Text>
              <Text style={styles.heroBody}>{copy.familyReportsDescription}</Text>
            </LinearGradient>
            <View style={styles.childList}>
              {children.data.map(child => {
                const selected = child.studentUserId === selectedChild?.studentUserId;
                return <AnimatedPressable key={child.studentUserId} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setSelectedStudentId(child.studentUserId)} style={[styles.childChip, selected && styles.childChipSelected]}>
                  <Ionicons name={selected ? 'checkmark-circle' : 'person-circle-outline'} size={22} color={selected ? theme.violetDeep : theme.inkSoft} />
                  <Text style={[styles.childName, selected && styles.childNameSelected]}>{child.studentName}</Text>
                </AnimatedPressable>;
              })}
            </View>
            {report.isPending ? <View style={styles.state}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.body}>{copy.loading}</Text></View> : null}
            {report.isError ? <View style={styles.notice}><Text accessibilityRole="alert" style={styles.body}>{copy.familyLoadError}</Text><RetryButton label={copy.retry} onPress={() => void report.refetch()} /></View> : null}
            {report.data ? <>
              <View style={styles.summary}>
                <Summary value={report.data.assignmentCount} label={zh ? '学习任务' : 'Assignments'} icon="book-outline" styles={styles} />
                <Summary value={report.data.notStartedCount} label={copy.familyNotStartedStatus} icon="leaf-outline" styles={styles} />
                <Summary value={report.data.inProgressCount} label={copy.familyInProgressStatus} icon="pencil-outline" styles={styles} />
                <Summary value={report.data.submittedCount} label={copy.familySubmittedStatus} icon="checkmark-circle-outline" styles={styles} />
                <Summary value={report.data.publishedResultCount} label={zh ? '已发布结果' : 'Results published'} icon="ribbon-outline" styles={styles} />
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

function Summary({ value, label, icon, styles }: { value: number; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; styles: ReturnType<typeof useStyles>['styles'] }) {
  const { theme } = useStyles();
  return <View style={styles.summaryItem}><Ionicons name={icon} size={24} color={theme.violetDeep} /><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryText}>{label}</Text></View>;
}

function RetryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { styles } = useStyles();
  return <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.retry}><Text style={styles.retryText}>{label}</Text></AnimatedPressable>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 18, padding: appSpacing.lg, paddingBottom: 36 },
  hero: { borderRadius: appRadii.hero, padding: 22, gap: appSpacing.md, borderBottomWidth: 2, borderColor: theme.primaryShadow },
  heroTitle: { color: theme.heroInk, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.stat.fontSize, lineHeight: appTextStyles.stat.lineHeight },
  heroBody: { color: theme.heroInk, fontFamily: typography.bodyBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  childList: { flexDirection: 'row', flexWrap: 'wrap', gap: appSpacing.sm },
  childChip: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 1, borderBottomWidth: 2, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: appSpacing.sm, justifyContent: 'center', paddingHorizontal: appSpacing.md, paddingVertical: 10, maxWidth: '100%' },
  childChipSelected: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  childName: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.label.fontSize, flexShrink: 1 },
  childNameSelected: { color: theme.violetDeep },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryItem: { backgroundColor: theme.paper, borderColor: theme.line, borderWidth: 1, borderBottomWidth: 2, borderRadius: appRadii.card, padding: appSpacing.lg, gap: appSpacing.sm, flexBasis: '45%', flexGrow: 1 },
  summaryValue: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.pageTitle.fontSize, lineHeight: appTextStyles.pageTitle.lineHeight },
  summaryText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  state: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 50 },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: appRadii.control, borderWidth: 1.5, gap: 7, padding: 14 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  retry: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 11, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  retryText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
}));
