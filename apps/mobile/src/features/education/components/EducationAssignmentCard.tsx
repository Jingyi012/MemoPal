import { learningTypography as typography, createLearningStyles as createThemedStyles } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ArrowRight } from '@/core/icons';
import type { MyEducationAssignment } from '@/features/education/types/educationAssignment.types';
import { useEducationCopy } from '@/features/education/i18n';
import { getEducationAssignmentStatus } from '@/features/education/utils/educationAssignmentStatus';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLearningCopy } from './LearningUi';

type EducationAssignmentCardProps = Readonly<{
  assignment: MyEducationAssignment;
  onPress: () => void;
}>;

export function EducationAssignmentCard({ assignment, onPress }: EducationAssignmentCardProps) {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const { zh } = useLearningCopy();
  const opensAt = new Date(assignment.opensAt);
  const dueAt = new Date(assignment.dueAt);
  const statusKey = getEducationAssignmentStatus(assignment);
  const status = copy[statusKey];
  const locale = copy.locale;
  const dateOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };
  const formatDate = (date: Date) => new Intl.DateTimeFormat(locale, dateOptions).format(date);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${assignment.title}, ${status}. ${statusKey === 'upcoming' ? copy.opensAt : copy.dueAt}: ${formatDate(statusKey === 'upcoming' ? opensAt : dueAt)}. ${assignment.timeLimitMinutes == null ? copy.noTimeLimit : copy.timeLimit(assignment.timeLimitMinutes)}`}
      accessibilityHint={copy.viewAssignment}
      onPress={onPress}
      style={[styles.card, { borderColor: statusKey === 'open' ? theme.mintLine : theme.line }]}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name={assignment.scope === 'family' ? 'home-outline' : 'school-outline'} size={17} color={theme.violetDeep} />
            <Text style={styles.meta}>{assignment.scope === 'family' ? (zh ? '家人安排' : 'From family') : (zh ? '课堂任务' : 'From class')}</Text>
          </View>
          <Text style={[styles.status, styles[statusKey]]}>
            {status}
          </Text>
        </View>
        <Text style={styles.title}>{assignment.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Ionicons name="calendar-outline" size={17} color={theme.inkSoft} />
          <Text style={[styles.meta, { flex: 1 }]}>{statusKey === 'upcoming' ? copy.opensAt : copy.dueAt}: {formatDate(statusKey === 'upcoming' ? opensAt : dueAt)}</Text>
        </View>
        <Text style={styles.meta}>
          {assignment.timeLimitMinutes == null ? copy.noTimeLimit : copy.timeLimit(assignment.timeLimitMinutes)}
        </Text>
        <View style={[styles.footer, { backgroundColor: statusKey === 'open' ? theme.mintTint : theme.violetTint }]}>
          <Text style={[styles.footerText, { color: statusKey === 'open' ? theme.successText : theme.violetDeep }]}>{copy.viewAssignment}</Text>
          <ArrowRight size={18} color={statusKey === 'open' ? theme.successText : theme.violetDeep} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.paper,
    borderColor: theme.line,
    borderRadius: 22,
    borderWidth: 2,
    borderBottomWidth: 6,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  copy: { flex: 1, gap: 12, minWidth: 0 },
  titleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19, lineHeight: 26 },
  footer: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  footerText: { flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 13, lineHeight: 19 },
  status: { borderRadius: 999, fontFamily: typography.bodyExtraBold, fontSize: 13, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3 },
  upcoming: { backgroundColor: theme.skyTint, color: theme.link },
  open: { backgroundColor: theme.mintTint, color: theme.successText },
  pastDue: { backgroundColor: theme.peachTint, color: theme.berryDeep },
  meta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 17 },
}));
