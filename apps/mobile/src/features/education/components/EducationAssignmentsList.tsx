import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import type { MyEducationAssignment } from '@/features/education/types/educationAssignment.types';
import { useEducationCopy } from '@/features/education/i18n';
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LearningSkeleton, useLearningCopy } from './LearningUi';
import { getEducationAssignmentStatus } from '../utils/educationAssignmentStatus';
import { useAuth } from '@/contexts/AuthProvider';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import AnimatedPressable from '@/components/AnimatedPressable';
import { groupEducationAssignmentsByCourse } from '../utils/groupEducationAssignmentsByCourse';
import { EducationCourseAssignmentGroup } from './EducationCourseAssignmentGroup';

type EducationAssignmentsListProps = Readonly<{
  assignments: readonly MyEducationAssignment[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onOpen: (assignment: MyEducationAssignment) => void;
  workspace?: boolean;
}>;

export function EducationAssignmentsList({
  assignments,
  isLoading,
  isError,
  onRetry,
  onOpen,
  workspace = false,
}: EducationAssignmentsListProps) {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const { zh } = useLearningCopy();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'open' | 'upcoming' | 'pastDue'>('all');
  const visible = workspace && filter !== 'all' ? assignments.filter(item => getEducationAssignmentStatus(item) === filter) : assignments;
  const courses = groupEducationAssignmentsByCourse(visible);
  const openCount = assignments.filter(item => getEducationAssignmentStatus(item) === 'open').length;

  // The Home screen is shared by all players, not just classroom learners.
  // Keep the task workspace contextual: show it when there is work, while
  // preserving loading and error states so assigned learners can recover.
  if (!workspace && !isLoading && !isError && assignments.length === 0) return null;

  return (
    <View style={styles.section}>
      {workspace && (isLoading || isError || assignments.length > 0) ? <LinearGradient colors={theme.hero as [string, string]} start={[0, 0]} end={[1, 1]} style={styles.hero}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={styles.heroIcon}><Ionicons name="rocket-outline" size={30} color={theme.heroInk} /></View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text accessibilityRole="header" style={styles.heroTitle}>{zh ? '每次一小步' : 'One little step at a time'}</Text>
            <Text style={styles.heroBody}>{isLoading || isError ? (zh ? '和伙伴一起，探索今天的任务' : 'Explore your learning missions') : openCount ? (zh ? `${openCount} 个任务已开放，挑一个看看吧` : `${openCount} ${openCount === 1 ? 'assignment is' : 'assignments are'} open. Pick one to explore.`) : (zh ? '在这里找到家人和老师安排的学习' : 'Find learning from your family and teachers here')}</Text>
          </View>
        </View>
      </LinearGradient> : !workspace ? <Text accessibilityRole="header" style={styles.heading}>{copy.title}</Text> : null}
      {isLoading ? (
        <LearningSkeleton />
      ) : isError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{copy.loadErrorTitle}</Text>
          <Text style={styles.noticeBody}>{copy.loadErrorBody}</Text>
          <AnimatedPressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
            <Text style={styles.retryText}>{copy.retry}</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.onAccent} />
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.courses}>
          {workspace && assignments.length > 0 ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['all', 'open', 'upcoming', 'pastDue'] as const).map(key => <AnimatedPressable key={key} accessibilityRole="button" accessibilityState={{ selected: filter === key }} onPress={() => setFilter(key)}
              style={[styles.chip, { backgroundColor: filter === key ? theme.violetDeep : theme.paper, borderColor: filter === key ? theme.primaryShadow : theme.line }]}>
              <Text style={[styles.chipText, { color: filter === key ? theme.onAccent : theme.inkSoft }]}>{key === 'all' ? (zh ? '全部' : 'All') : copy[key]} · {key === 'all' ? assignments.length : assignments.filter(item => getEducationAssignmentStatus(item) === key).length}</Text>
            </AnimatedPressable>)}
          </View> : null}
          {visible.length === 0 ? <View style={styles.empty}>
            <View style={styles.emptyIcon}><CompanionActor stage={user?.level ?? 1} size={90} cue={{ action: 'hello', sequence: 0 }} /></View>
            <Text style={styles.heading}>{assignments.length ? (zh ? '这里暂时没有任务' : 'No assignments in this view') : (zh ? '新的学习任务会出现在这里' : 'Your next learning mission starts here')}</Text>
            <Text style={styles.stateText}>{assignments.length ? (zh ? '换个分类，看看其他学习安排。' : 'Try another filter to see your other assignments.') : (zh ? '家人或老师分配任务后，你就可以在这里开始。' : 'When your family or teacher assigns learning, you can open it here.')}</Text>
            {assignments.length ? <AnimatedPressable accessibilityRole="button" onPress={() => setFilter('all')} style={styles.chip}><Text style={[styles.chipText, { color: theme.violetDeep }]}>{zh ? '查看全部任务' : 'Show all assignments'}</Text></AnimatedPressable> : null}
          </View> : null}
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
  hero: { borderRadius: 26, padding: 20, marginBottom: 10, borderBottomWidth: 6, borderColor: theme.primaryShadow },
  heroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: theme.heroOverlay, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: theme.heroInk, fontFamily: typography.displayExtraBold, fontSize: 22, lineHeight: 29 },
  heroBody: { color: theme.heroInk, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 20 },
  chip: { borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.line, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  chipText: { fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18 },
  empty: { alignItems: 'center', gap: 12, padding: 24, borderRadius: 24, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.line, backgroundColor: theme.paper },
  emptyIcon: { padding: 18, borderRadius: 24, backgroundColor: theme.violetTint },
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
