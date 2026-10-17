import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import { typography } from '@/theme/typography';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export type WeekFootprintDay = { date: string; sessions: number };

type WeekFootprintCardProps = {
  title: string;
  activity: WeekFootprintDay[];
  footerText: string;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
};

export function WeekFootprintCard({
  title,
  activity,
  footerText,
  selectedDate,
  onSelectDate,
  containerStyle,
}: WeekFootprintCardProps) {
  const { styles } = useStyles();
  const { t } = useTranslation('home');
  const weekdayLabels = [
    t('weekdayMon'),
    t('weekdayTue'),
    t('weekdayWed'),
    t('weekdayThu'),
    t('weekdayFri'),
    t('weekdaySat'),
    t('weekdaySun'),
  ];
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const activeDays = activity.filter((day) => day.sessions > 0).length;

  return (
    <View style={[styles.card, containerStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.countPill}>
          <Text style={styles.count}>{activeDays}/7</Text>
          <Text style={styles.countUnit}>{t('weekDaysUnit')}</Text>
        </View>
      </View>
      <View style={styles.days}>
        {activity.map((day) => {
          const dateKey = day.date.slice(0, 10);
          const date = new Date(`${dateKey}T12:00:00`);
          const weekdayIndex = (date.getDay() + 6) % 7;
          const label = weekdayLabels[weekdayIndex] ?? '';
          const isToday = dateKey === todayKey;
          const isSelected = selectedDate?.slice(0, 10) === dateKey;
          const sessionsDone = day.sessions > 0;
          const content = (
            <>
              <View
                style={[
                  styles.orb,
                  sessionsDone && styles.orbDone,
                  isToday && styles.orbToday,
                  isSelected && styles.orbSelected,
                ]}>
                <Text style={[styles.orbText, sessionsDone && styles.orbTextDone]}>
                  {sessionsDone ? '🐾' : isToday ? '·' : ''}
                </Text>
              </View>
              <Text style={[styles.dayLabel, (isToday || isSelected) && styles.dayLabelActive]}>
                {label}
              </Text>
            </>
          );

          return onSelectDate ? (
            <AnimatedPressable
              key={day.date}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${day.sessions} ${t('practiceSessions')}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectDate(day.date)}
              style={[styles.day, isSelected && styles.daySelected]}>
              {content}
            </AnimatedPressable>
          ) : (
            <View
              key={day.date}
              accessible
              accessibilityLabel={`${label}: ${day.sessions} ${t('practiceSessions')}`}
              style={styles.day}>
              {content}
            </View>
          );
        })}
      </View>
      <Text style={styles.footer}>{footerText}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    card: {
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.paper,
    },
    header: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 15 },
    countPill: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: theme.violetTint,
    },
    count: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 13 },
    countUnit: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 9 },
    days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    day: {
      flex: 1,
      minWidth: 0,
      minHeight: 62,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      gap: 4,
    },
    daySelected: { backgroundColor: theme.violetTint },
    orb: {
      width: 31,
      height: 31,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 99,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.canvas,
    },
    orbDone: { borderColor: theme.violet, backgroundColor: theme.violet },
    orbToday: { borderColor: theme.violetDeep, borderWidth: 2 },
    orbSelected: { borderColor: theme.sun, borderWidth: 2 },
    orbText: { color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 12 },
    orbTextDone: { color: theme.onAccent },
    dayLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 9 },
    dayLabelActive: { color: theme.violetDeep },
    footer: {
      minHeight: 23,
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 10,
      marginTop: 5,
      paddingHorizontal: 2,
    },
  })
);
