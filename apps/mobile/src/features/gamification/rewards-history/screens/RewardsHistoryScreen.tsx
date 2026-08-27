import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { BaseCard } from '@/components/BaseCard';
import { useAllBadges } from '@/features/gamification/shared/hooks/useBadges';
import { useMilestones } from '@/features/gamification/shared/hooks/useMilestones';
import { useXpEvents } from '@/features/gamification/shared/hooks/useXpEvents';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

type RewardFilter = 'all' | 'xp' | 'badge' | 'milestone';

type TimelineEntry = {
  id: string;
  type: Exclude<RewardFilter, 'all'>;
  title: string;
  subtitle?: string;
  points?: number;
  occurredAt: string;
};

const FILTERS: { key: RewardFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'xp', label: 'XP' },
  { key: 'badge', label: 'Badges' },
  { key: 'milestone', label: 'Milestones' },
];

function mapXpEventTitle(sourceType: string): string {
  const normalized = (sourceType || '').toLowerCase();
  switch (normalized) {
    case 'lesson_initial_completion':
      return 'First Lesson Completion';
    case 'lesson_complete':
      return 'Lesson Completion';
    case 'review_complete':
      return 'Review Completed';
    case 'mission_complete':
      return 'Mission Reward Claimed';
    case 'word_mastered':
      return 'Word Mastered';
    case 'streak_bonus':
      return 'Streak Bonus';
    case 'manual_adjustment':
      return 'Manual XP Adjustment';
    default:
      return 'XP Earned';
  }
}

function getDayLabel(dateIso: string): string {
  const date = new Date(dateIso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const thatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (thatDay === today) return 'Today';
  if (thatDay === today - oneDayMs) return 'Yesterday';
  return date.toLocaleDateString();
}

export default function RewardsHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation('rewards');
  const historyWindowDays = 30;
  const { events: xpEvents, isLoading: isLoadingXp } = useXpEvents({ recentDays: historyWindowDays });
  const { badges, isLoading: isLoadingBadges } = useAllBadges();
  const { milestones, isLoading: isLoadingMilestones } = useMilestones();
  const [filter, setFilter] = useState<RewardFilter>('all');

  const isLoading = isLoadingXp || isLoadingBadges || isLoadingMilestones;

  const timeline = useMemo<TimelineEntry[]>(() => {
    const cutoffTime = Date.now() - historyWindowDays * 24 * 60 * 60 * 1000;
    const isWithinWindow = (iso: string | null | undefined) => {
      if (!iso) return false;
      const timestamp = new Date(iso).getTime();
      if (!Number.isFinite(timestamp)) return false;
      return timestamp >= cutoffTime;
    };

    const xpEntries: TimelineEntry[] = xpEvents
      .filter((event) => !event.isDeleted)
      .map((event) => ({
        id: `xp-${event.id}`,
        type: 'xp',
        title: mapXpEventTitle(event.sourceType),
        //subtitle: mapXpEventSubtitle(event.sourceId ?? undefined),
        points: event.xpAmount,
        occurredAt: event.createdAt,
      }));

    const badgeEntries: TimelineEntry[] = badges
      .filter((badge) => !!badge.earnedAt && !badge.isDeleted && isWithinWindow(badge.earnedAt))
      .map((badge) => ({
        id: `badge-${badge.id}`,
        type: 'badge',
        title: badge.name,
        subtitle: badge.description ?? 'Badge earned',
        occurredAt: badge.earnedAt as string,
      }));

    const milestoneEntries: TimelineEntry[] = milestones
      .filter(
        (milestone) =>
          !!milestone.achievedAt && !milestone.isDeleted && isWithinWindow(milestone.achievedAt)
      )
      .map((milestone) => ({
        id: `milestone-${milestone.id}`,
        type: 'milestone',
        title: milestone.title,
        subtitle: milestone.description ?? 'Milestone achieved',
        occurredAt: milestone.achievedAt as string,
      }));

    return [...xpEntries, ...badgeEntries, ...milestoneEntries].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }, [badges, milestones, xpEvents]);

  const filteredTimeline = useMemo(() => {
    if (filter === 'all') return timeline;
    return timeline.filter((item) => item.type === filter);
  }, [filter, timeline]);

  const groupedTimeline = useMemo(() => {
    const groups = new Map<string, TimelineEntry[]>();
    for (const item of filteredTimeline) {
      const dayLabel = getDayLabel(item.occurredAt);
      if (!groups.has(dayLabel)) {
        groups.set(dayLabel, []);
      }
      groups.get(dayLabel)?.push(item);
    }
    return Array.from(groups.entries());
  }, [filteredTimeline]);

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <View className="flex-1 bg-[#FFFDF8]">
      <CommonHeader
        title={t('title')}
        description={t('description')}
        hideBackButton={false}
        backAction={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-4">
          <BaseCard className="p-4" padding="none">
            <Text className="text-sm font-semibold text-[#2B2A3D]">Filter</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {FILTERS.map((item) => {
                const isActive = item.key === filter;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setFilter(item.key)}
                    className={`min-w-[68px] items-center justify-center rounded-full px-3 py-1.5 ${
                      isActive ? 'bg-[#7A68E0]' : 'bg-[#F6F3EA]'
                    }`}>
                    <Text
                      className={`text-center text-xs font-semibold ${
                        isActive ? 'text-white' : 'text-[#6B6A80]'
                      }`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className="mt-3 text-xs text-[#6B6A80]">
              Showing only rewards from the latest {historyWindowDays} days.
            </Text>
          </BaseCard>

          {groupedTimeline.length === 0 ? (
            <BaseCard className="mt-4 p-5" padding="none">
              <Text className="text-sm text-[#6B6A80]">No rewards recorded yet.</Text>
            </BaseCard>
          ) : (
            groupedTimeline.map(([dayLabel, items]) => (
              <View key={dayLabel} className="mt-4">
                <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6A80]">
                  {dayLabel}
                </Text>
                <View className="gap-2">
                  {items.map((item) => {
                    const isXp = item.type === 'xp';
                    const isBadge = item.type === 'badge';
                    return (
                      <BaseCard key={item.id} className="p-4" padding="none">
                        <View className="flex-row items-center">
                          <View
                            className={`h-9 w-9 items-center justify-center rounded-full ${
                              isXp ? 'bg-[#EEE9FF]' : isBadge ? 'bg-[#FFF7E0]' : 'bg-[#F1FBF5]'
                            }`}>
                            {isXp ? (
                              <Text className="text-base">✨</Text>
                            ) : isBadge ? (
                              <Text className="text-base">🏅</Text>
                            ) : (
                              <Text className="text-base">🚩</Text>
                            )}
                          </View>
                          <View className="ml-3 flex-1">
                            <Text className="font-semibold text-[#2B2A3D]">{item.title}</Text>
                            {!!item.subtitle && (
                              <Text className="mt-0.5 text-xs text-[#6B6A80]">{item.subtitle}</Text>
                            )}
                          </View>
                          {typeof item.points === 'number' ? (
                            <Text className="text-xs font-semibold text-[#3FB87F]">
                              +{item.points} XP
                            </Text>
                          ) : null}
                        </View>
                        <Text className="mt-2 text-xs text-[#9A97A7]">
                          {new Date(item.occurredAt).toLocaleTimeString()}
                        </Text>
                      </BaseCard>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
