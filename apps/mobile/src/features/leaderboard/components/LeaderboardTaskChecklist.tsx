import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { CheckCircle2, Circle } from '@/core/icons';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { LeaderboardTaskProgress } from '@/features/leaderboard/api/communityLeaderboard.api';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { StyleSheet, View } from 'react-native';

export function LeaderboardTaskChecklist({
  tasks,
  compact = false,
}: {
  tasks: readonly LeaderboardTaskProgress[];
  compact?: boolean;
}) {
  const { t, language } = useTranslation('library');
  const { styles, theme } = useStyles();
  if (tasks.length === 0) return null;

  const completedCount = tasks.filter(task => task.isCompleted).length;
  return <View style={[styles.card, compact && styles.cardCompact]}>
    {!compact ? <View style={styles.header}>
      <Text style={styles.title}>{t('leaderboardTodayTasks')}</Text>
      <Text style={styles.summary}>{t('leaderboardTaskSummary', { completed: completedCount, total: tasks.length })}</Text>
    </View> : null}
    <View style={styles.list}>
      {tasks.map(task => <View
        key={task.id}
        accessible
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.isCompleted }}
        accessibilityLabel={`${language === 'zh' ? task.titleZh : task.titleEn}, ${t(task.metric === 'distinct-recall-items' ? 'leaderboardMetricRecall' : 'leaderboardMetricDue', { count: task.threshold })}, ${t('leaderboardTaskProgress', { current: task.currentValue, target: task.threshold })}, ${task.isCompleted ? t('leaderboardTaskCompleted') : t('leaderboardTaskRemaining')}`}
        style={[styles.row, task.isCompleted && styles.rowDone]}>
        <View style={styles.statusIcon}>
          {task.isCompleted ? <CheckCircle2 size={19} color={theme.successText} /> : <Circle size={19} color={theme.violetDeep} />}
        </View>
        <View style={styles.copy}>
          <Text style={styles.taskTitle}>{language === 'zh' ? task.titleZh : task.titleEn}</Text>
          <Text style={styles.metric}>{t(task.metric === 'distinct-recall-items' ? 'leaderboardMetricRecall' : 'leaderboardMetricDue', { count: task.threshold })}</Text>
        </View>
        <View style={styles.rewardColumn}>
          <Text style={[styles.progress, task.isCompleted && styles.progressDone]}>{t('leaderboardTaskProgress', { current: task.currentValue, target: task.threshold })}</Text>
          <Text style={styles.reward}>+{task.points} {t('leaderboardScoreUnit')}</Text>
        </View>
      </View>)}
    </View>
  </View>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  card: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 19, borderWidth: 1.5, gap: 10, padding: appSpacing.md },
  cardCompact: { backgroundColor: 'transparent', borderWidth: 0, gap: appSpacing.sm, padding: 0 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: appSpacing.sm },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.label.fontSize },
  summary: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  list: { gap: 7 },
  row: { alignItems: 'center', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1, flexDirection: 'row', gap: 9, minHeight: 60, paddingHorizontal: 9, paddingVertical: 7 },
  rowDone: { backgroundColor: theme.mintTint, borderColor: theme.mintLine },
  statusIcon: { alignItems: 'center', justifyContent: 'center', minHeight: 44, width: 24 },
  copy: { flex: 1, gap: 2 },
  taskTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  metric: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  rewardColumn: { alignItems: 'flex-end', gap: 2, minWidth: 58 },
  progress: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.small.fontSize },
  progressDone: { color: theme.successText },
  reward: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
}));
