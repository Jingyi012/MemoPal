import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { LearningChoiceMenu } from '@/features/education/components/LearningChoiceMenu';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useMilestones } from '@/features/gamification/shared/hooks/useMilestones';
import { useXpEvents } from '@/features/gamification/shared/hooks/useXpEvents';
import { typography } from '@/theme/typography';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

type RewardFilter = 'all' | 'xp' | 'milestone';
type TimelineEntry = { id: string; type: Exclude<RewardFilter, 'all'>; title: string; subtitle?: string; points?: number; occurredAt: string };

export default function RewardsHistoryScreen() {
  const { styles } = useStyles();
  const router = useRouter();
  const { t, language } = useTranslation('rewards');
  const zh = language === 'zh';
  const { events: xpEvents, isLoading: isLoadingXp, isError: xpError, refetch: refetchXp } = useXpEvents({ recentDays: 30 });
  const { milestones, isLoading: isLoadingMilestones, isError: milestonesError, refetch: refetchMilestones } = useMilestones();
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

  const loading = isLoadingXp || isLoadingMilestones;
  const hasError = (filter !== 'milestone' && xpError) || (filter !== 'xp' && milestonesError);
  const filters: { key: RewardFilter; label: string }[] = [
    { key: 'all', label: t('all') }, { key: 'xp', label: 'XP' }, { key: 'milestone', label: t('milestones') },
  ];

  return (
    <View style={styles.page}>
      <CommonHeader title={t('title')} description={t('description')} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LearningChoiceMenu value={filter} onChange={value => setFilter(value as RewardFilter)}
          title={zh ? '奖励类型' : 'Reward type'} options={filters.map(item => ({ value: item.key, label: item.label }))} />
        <Text style={styles.windowNote}>{zh ? 'XP：最近 30 天 · 里程碑：全部已达成' : 'XP: last 30 days · Milestones: all achieved'}</Text>
        {hasError ? <View style={styles.notice}><ModuleNoticeCard title={zh ? '部分记录暂时无法加载' : 'Some rewards could not load'}
          body={zh ? '已加载的记录仍会保留，重试即可更新。' : 'Loaded rewards remain available. Retry to update the history.'}
          actionLabel={zh ? '重试' : 'Retry'} onAction={() => Promise.all([refetchXp(), refetchMilestones()])} /></View> : null}
        {loading ? <LoadingView /> : !hasError && groups.length === 0 ? (
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

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' }, content: { padding: appSpacing.lg, paddingBottom: 48 }, notice: { marginTop: appSpacing.lg },
  windowNote: { color: theme.inkMuted, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: appSpacing.xs },
  group: { marginTop: appSpacing.xl }, day: { color: theme.inkSoft, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.small.fontSize, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: appSpacing.sm }, list: { gap: 9 },
  rewardCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: appRadii.control, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper, padding: appSpacing.md },
  icon: { width: 40, height: 40, borderRadius: appRadii.control, backgroundColor: theme.skyTint, alignItems: 'center', justifyContent: 'center' }, milestoneIcon: { backgroundColor: theme.sunTint }, emoji: { fontSize: appArtworkSizes.tiny }, copy: { flex: 1, minWidth: 0 },
  rewardTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize, lineHeight: appTextStyles.body.lineHeight }, rewardSubtitle: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, marginTop: 3 }, time: { color: theme.inkMuted, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, marginTop: appSpacing.xs }, points: { color: theme.successText, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.small.fontSize },
  emptyCard: { alignItems: 'center', marginTop: appSpacing.xxl, borderRadius: appRadii.card, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper, padding: appSpacing.xxl }, emptyEmoji: { fontSize: appArtworkSizes.small }, emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.label.fontSize, marginTop: appSpacing.sm }, emptyBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, textAlign: 'center', marginTop: appSpacing.xs },
}));
