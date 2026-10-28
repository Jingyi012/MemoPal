import { learningTypography as typography, createLearningStyles as createThemedStyles } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ArrowRight } from '@/core/icons';
import type { MyEducationAssignment } from '@/features/education/types/educationAssignment.types';
import { useEducationCopy } from '@/features/education/i18n';
import { getEducationAssignmentStatus } from '@/features/education/utils/educationAssignmentStatus';
import { StyleSheet, Text, View } from 'react-native';

type EducationAssignmentCardProps = Readonly<{
  assignment: MyEducationAssignment;
  onPress: () => void;
}>;

export function EducationAssignmentCard({ assignment, onPress }: EducationAssignmentCardProps) {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
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
      accessibilityLabel={`${assignment.title}, ${status}`}
      accessibilityHint={copy.viewAssignment}
      onPress={onPress}
      style={styles.card}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{assignment.title}</Text>
          <Text style={[styles.status, styles[statusKey]]}>
            {status}
          </Text>
        </View>
        <Text style={styles.meta}>{copy.opensAt}: {formatDate(opensAt)}</Text>
        <Text style={styles.meta}>{copy.dueAt}: {formatDate(dueAt)}</Text>
        <Text style={styles.meta}>
          {assignment.timeLimitMinutes == null ? copy.noTimeLimit : copy.timeLimit(assignment.timeLimitMinutes)}
        </Text>
      </View>
      <ArrowRight size={18} color={theme.inkSoft} />
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
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  copy: { flex: 1, gap: 3, minWidth: 0 },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  title: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 15, lineHeight: 21 },
  status: { borderRadius: 999, fontFamily: typography.bodyExtraBold, fontSize: 11, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3 },
  upcoming: { backgroundColor: theme.skyTint, color: theme.link },
  open: { backgroundColor: theme.mintTint, color: theme.successText },
  pastDue: { backgroundColor: theme.peachTint, color: theme.berryDeep },
  meta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 17 },
}));
