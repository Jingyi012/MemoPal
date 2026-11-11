import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createThemedStyles } from '@/theme/createThemedStyles';
import type { XpEventRecord } from '@/features/gamification/shared/api/xpEvent';
import { typography } from '@/theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

type WeeklyActivityCardProps = {
  title: string;
  events?: XpEventRecord[];
  activity?: { date: string; sessions: number }[];
};

/** Shared seven-day XP activity card used on Home and Progress. */
export function WeeklyActivityCard({ title, events = [], activity }: WeeklyActivityCardProps) {
  const { styles } = useStyles();
  const { t } = useTranslation('home');
  const weekdayLabels = useMemo(() => [
    t('weekdaySun'),
    t('weekdayMon'),
    t('weekdayTue'),
    t('weekdayWed'),
    t('weekdayThu'),
    t('weekdayFri'),
    t('weekdaySat'),
  ], [t]);
  const chartActivity = useMemo(() => {
    if (activity) {
      const values = activity.map((day) => day.sessions);
      const max = Math.max(1, ...values);
      return values.map((value, index) => ({
        label: formatWeekday(activity[index]?.date, weekdayLabels),
        value,
        percent: Math.round((value / max) * 100),
        today: index === values.length - 1,
      }));
    }
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - (6 - index));
      return date;
    });
    const values = days.map((day) => events
      .filter((event) => {
        const eventDate = new Date(event.createdAt);
        return eventDate.getFullYear() === day.getFullYear()
          && eventDate.getMonth() === day.getMonth()
          && eventDate.getDate() === day.getDate();
      })
      .reduce((sum, event) => sum + Math.max(0, event.xpAmount), 0));
    const max = Math.max(1, ...values);
    return values.map((value, index) => ({
      label: formatWeekday(days[index], weekdayLabels),
      value,
      percent: Math.round((value / max) * 100),
      today: index === 6,
    }));
  }, [activity, events, weekdayLabels]);

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.unit}>{activity ? t('practiceSessions') : 'XP'}</Text>
      </View>
      <View style={styles.barChart}>
        {chartActivity.map((day, index) => (
          <View key={`${day.label}-${index}`} style={styles.barColumn} accessible accessibilityLabel={`${day.label}: ${day.value}`}>
            <Text style={styles.barValue}>{day.value}</Text>
            <View style={styles.barPlot}>
            <LinearGradient
              colors={day.today ? ['#FFC93C', '#F2A900'] : ['#4FC0E8', '#3A9DC4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.bar, { height: `${day.percent}%` }]}
            />
            </View>
            <Text style={styles.barLabel}>{day.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatWeekday(value: string | Date | undefined, labels: string[]) {
  if (!value) return '';
  const date = value instanceof Date
    ? value
    : new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : labels[date.getDay()] ?? '';
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.paper,
    borderColor: theme.line,
    borderRadius: appRadii.hero,
    borderWidth: 2,
    marginTop: 14,
    padding: 18,
  },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: appSpacing.sm, marginBottom: appSpacing.sm },
  unit: { color: theme.violetDeep, backgroundColor: theme.violetTint, borderRadius: 8, paddingHorizontal: appSpacing.sm, paddingVertical: appSpacing.xs, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
  title: {
    color: theme.inkSoft,
    fontFamily: typography.displayExtraBold,
    fontSize: appTextStyles.label.fontSize,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  barChart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: appSpacing.sm,
    height: 132,
    paddingBottom: 2,
    paddingHorizontal: 2,
    paddingTop: appSpacing.sm,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barPlot: { flex: 1, minHeight: 0, width: '100%', borderRadius: 8, backgroundColor: theme.violetTint, justifyContent: 'flex-end', overflow: 'hidden' },
  barValue: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  bar: { borderRadius: 6, width: '100%' },
  barLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
}));
