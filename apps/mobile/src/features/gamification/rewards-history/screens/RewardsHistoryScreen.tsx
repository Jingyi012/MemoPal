import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useMilestones } from '@/features/gamification/shared/hooks/useMilestones';
import { useXpEvents } from '@/features/gamification/shared/hooks/useXpEvents';
import { typography } from '@/theme/typography';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type RewardFilter = 'all' | 'xp' | 'milestone';
type TimelineEntry = { id: string; type: Exclude<RewardFilter, 'all'>; title: string; subtitle?: string; points?: number; occurredAt: string };

export default function RewardsHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation('rewards');
  const { events: xpEvents, isLoading: isLoadingXp } = useXpEvents({ recentDays: 30 });
  const { milestones, isLoading: isLoadingMilestones } = useMilestones();
  const [filter, setFilter] = useState<RewardFilter>('all');

  const timeline = useMemo<TimelineEntry[]>(() => {
    const xpEntries: TimelineEntry[] = xpEvents.filter((event) => !event.isDeleted).map((event) => ({
      id: `xp-${event.id}`,
      type: 'xp',
      title: event.sourceType === 'memory_learned' ? t('memoryLearned') : event.sourceType === 'due_review_completed' ? t('reviewCompleted') : event.sourceType === 'extra_practice_completed' ? t('extraPractice') : t('xpEarned'),
      points: event.xpAmount,
      occurredAt: event.createdAt,
    }));
    const milestoneEntries: TimelineEntry[] = milestones
      .filter((milestone) => Boolean(milestone.achievedAt) && !milestone.isDeleted)
      .map((milestone) => ({
        id: `milestone-${milestone.id}`,
        type: 'milestone',
        title: milestone.key === 'first_recall' ? t('firstRecallTitle') : milestone.key === 'practice_5' ? t('practiceFiveTitle') : milestone.key === 'words_20' ? t('wordsTwentyTitle') : milestone.key === 'streak_3' ? t('streakThreeTitle') : milestone.key === 'level_5' ? t('levelFiveTitle') : milestone.title,
        subtitle: milestone.key === 'first_recall' ? t('firstRecallBody') : milestone.key === 'practice_5' ? t('practiceFiveBody') : milestone.key === 'words_20' ? t('wordsTwentyBody') : milestone.key === 'streak_3' ? t('streakThreeBody') : milestone.key === 'level_5' ? t('levelFiveBody') : milestone.description ?? t('milestoneAchieved'),
        occurredAt: milestone.achievedAt as string,
      }));
    return [...xpEntries, ...milestoneEntries].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
  }, [milestones, t, xpEvents]);

  const filtered = filter === 'all' ? timeline : timeline.filter((entry) => entry.type === filter);
  const groups = useMemo(() => {
    const result = new Map<string, TimelineEntry[]>();
    for (const entry of filtered) {
      const day = dayLabel(entry.occurredAt, t('today'), t('yesterday'));
      result.set(day, [...(result.get(day) ?? []), entry]);
    }
    return [...result.entries()];
  }, [filtered, t]);

  if (isLoadingXp || isLoadingMilestones) return <LoadingView />;
  const filters: { key: RewardFilter; label: string }[] = [
    { key: 'all', label: t('all') }, { key: 'xp', label: 'XP' }, { key: 'milestone', label: t('milestones') },
  ];

  return (
    <View style={styles.page}>
      <CommonHeader title={t('title')} description={t('description')} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.filterRow}>
          {filters.map((item) => (
            <AnimatedPressable key={item.key} accessibilityRole="button" onPress={() => setFilter(item.key)} style={[styles.filter, filter === item.key && styles.filterActive]}>
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
            </AnimatedPressable>
          ))}
        </View>
        <Text style={styles.windowNote}>{t('latestThirtyDays')}</Text>
        {groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌱</Text><Text style={styles.emptyTitle}>{t('emptyTitle')}</Text><Text style={styles.emptyBody}>{t('emptyBody')}</Text>
          </View>
        ) : groups.map(([day, entries]) => (
          <View key={day} style={styles.group}>
            <Text style={styles.day}>{day}</Text>
            <View style={styles.list}>{entries.map((entry) => (
              <View key={entry.id} style={styles.rewardCard}>
                <View style={[styles.icon, entry.type === 'milestone' && styles.milestoneIcon]}><Text style={styles.emoji}>{entry.type === 'xp' ? '⭐' : '🏆'}</Text></View>
                <View style={styles.copy}>
                  <Text style={styles.rewardTitle}>{entry.title}</Text>
                  {entry.subtitle ? <Text style={styles.rewardSubtitle}>{entry.subtitle}</Text> : null}
                  <Text style={styles.time}>{new Date(entry.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                {entry.points != null ? <Text style={styles.points}>+{entry.points} XP</Text> : null}
              </View>
            ))}</View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function dayLabel(iso: string, todayLabel: string, yesterdayLabel: string) {
  const date = new Date(iso); const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (startDate === startToday) return todayLabel;
  if (startDate === startToday - 86_400_000) return yesterdayLabel;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' }, content: { padding: 16, paddingBottom: 48 }, filterRow: { flexDirection: 'row', gap: 8 },
  filter: { minHeight: 38, borderRadius: 999, backgroundColor: theme.peachTint, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }, filterActive: { backgroundColor: theme.violetDeep },
  filterText: { color: '#6B6A80', fontFamily: typography.bodyExtraBold, fontSize: 11.5 }, filterTextActive: { color: '#FFFFFF' }, windowNote: { color: '#9A97A7', fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 9 },
  group: { marginTop: 20 }, day: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }, list: { gap: 9 },
  rewardCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 17, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 12 },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: theme.skyTint, alignItems: 'center', justifyContent: 'center' }, milestoneIcon: { backgroundColor: theme.sunTint }, emoji: { fontSize: 19 }, copy: { flex: 1, minWidth: 0 },
  rewardTitle: { color: '#2B2A3D', fontFamily: typography.bodyExtraBold, fontSize: 12.5 }, rewardSubtitle: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 2 }, time: { color: '#9A97A7', fontFamily: typography.bodyBold, fontSize: 9.5, marginTop: 4 }, points: { color: '#267A55', fontFamily: typography.displayExtraBold, fontSize: 11.5 },
  emptyCard: { alignItems: 'center', marginTop: 24, borderRadius: 18, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 24 }, emptyEmoji: { fontSize: 28 }, emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 8 }, emptyBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, textAlign: 'center', marginTop: 4 },
});
