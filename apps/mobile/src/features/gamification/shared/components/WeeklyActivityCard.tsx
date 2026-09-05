import type { XpEventRecord } from '@/features/gamification/shared/api/xpEvent';
import { typography } from '@/theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

type WeeklyActivityCardProps = {
  title: string;
  events?: XpEventRecord[];
  activity?: { date: string; sessions: number }[];
};

/** Shared seven-day XP activity card used on Home and Progress. */
export function WeeklyActivityCard({ title, events = [], activity }: WeeklyActivityCardProps) {
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
        percent: value ? Math.max(10, Math.round((value / max) * 100)) : 6,
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
      percent: value ? Math.max(10, Math.round((value / max) * 100)) : 6,
      today: index === 6,
    }));
  }, [activity, events, weekdayLabels]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.barChart}>
        {chartActivity.map((day, index) => (
          <View key={`${day.label}-${index}`} style={styles.barColumn}>
            <LinearGradient
              colors={day.today ? ['#FFC93C', '#F2A900'] : ['#4FC0E8', '#3A9DC4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.bar, { height: `${day.percent}%` }]}
            />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF8',
    borderColor: '#EEE9DC',
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 14,
    padding: 12,
  },
  title: {
    color: '#6B6A80',
    fontFamily: typography.displayExtraBold,
    fontSize: 11.5,
    letterSpacing: 0.3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  barChart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    height: 94,
    paddingBottom: 2,
    paddingHorizontal: 2,
    paddingTop: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: { borderRadius: 6, width: '100%' },
  barLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 9.5 },
});
