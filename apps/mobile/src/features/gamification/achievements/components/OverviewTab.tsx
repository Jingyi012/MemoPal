import { BaseCard } from '@/components/BaseCard';
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

interface BadgePill {
  id: string;
  name: string;
}

interface UpcomingMilestone {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  remaining: number;
}

interface OverviewTabProps {
  totalBadgeEarned: number;
  totalMilestonesAchieved: number;
  completedMissions: number;
  totalActiveMissions: number;
  recentBadges: BadgePill[];
  upcomingMilestones: UpcomingMilestone[];
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconBgClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconBgClass: string;
}) {
  return (
    <BaseCard className="flex-1 flex-col border-2 border-[#EEE9DC] bg-[#FFFDF8] p-3" padding="none">
      <View className="flex-col items-center justify-between">
        <View className={`mb-3 rounded-full p-2 ${iconBgClass}`}>
          <Text className="text-sm">{icon}</Text>
        </View>
        <Text className="text-xs font-semibold uppercase tracking-wider text-[#6B6A80]">
          {title}
        </Text>
      </View>
      <Text className="mt-3 text-center text-2xl font-bold text-[#2B2A3D]">{value}</Text>
      <Text className="mt-1 text-center text-xs text-[#6B6A80]">{subtitle}</Text>
    </BaseCard>
  );
}

export function OverviewTab({
  totalBadgeEarned,
  totalMilestonesAchieved,
  completedMissions,
  totalActiveMissions,
  recentBadges,
  upcomingMilestones,
}: OverviewTabProps) {
  const { t } = useTranslation('achievements');
  const missionCompletionPercent =
    totalActiveMissions > 0
      ? Math.max(0, Math.min(100, Math.round((completedMissions / totalActiveMissions) * 100)))
      : 0;

  return (
    <View className="gap-3">
      <BaseCard className="border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4" padding="none">
        <Text className="text-base font-bold text-[#2B2A3D]">{t('overview')}</Text>
        <Text className="mt-1 text-sm text-[#6B6A80]">
          {t('overviewBody')}
        </Text>

        <View className="mt-4 flex-row gap-2">
          <SummaryCard
            title={t('badges')}
            value={`${totalBadgeEarned}`}
            subtitle={t('earnedSoFar')}
            icon="🏅"
            iconBgClass="bg-[#FFF7E0]"
          />
          <SummaryCard
            title={t('milestones')}
            value={`${totalMilestonesAchieved}`}
            subtitle={t('achieved')}
            icon="🚩"
            iconBgClass="bg-[#EEE9FF]"
          />
          <SummaryCard
            title={t('missions')}
            value={`${completedMissions}/${totalActiveMissions}`}
            subtitle={`${missionCompletionPercent}% ${t('completed')}`}
            icon="🎯"
            iconBgClass="bg-[#F1FBF5]"
          />
        </View>
      </BaseCard>

      <BaseCard className="border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4" padding="none">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-[#2B2A3D]">{t('recentBadges')}</Text>
          <View className="rounded-full bg-[#FFF7E0] p-2">
            <Text className="text-sm">✨</Text>
          </View>
        </View>
        {recentBadges.length === 0 ? (
          <Text className="mt-2 text-sm text-[#6B6A80]">{t('noBadges')}</Text>
        ) : (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {recentBadges.map((badge) => (
              <View
                key={badge.id}
                className="rounded-full border border-[#FFD9E2] bg-[#FFF0F4] px-3 py-1.5">
                <Text className="text-sm font-semibold text-[#E8527A]">{badge.name}</Text>
              </View>
            ))}
          </View>
        )}
      </BaseCard>

      <BaseCard className="border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4" padding="none">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-[#2B2A3D]">{t('upcomingMilestones')}</Text>
          <Text className="text-xs text-[#6B6A80]">{t('closestFirst')}</Text>
        </View>
        {upcomingMilestones.length === 0 ? (
          <Text className="mt-2 text-sm text-[#6B6A80]">{t('allMilestones')}</Text>
        ) : (
          <View className="mt-3 gap-2">
            {upcomingMilestones.map((milestone) => {
              const progressPercent = Math.max(
                0,
                Math.min(
                  100,
                  Math.round((milestone.currentValue / Math.max(1, milestone.targetValue)) * 100)
                )
              );

              return (
                <View
                  key={milestone.id}
                  className="rounded-xl border border-[#EEE9DC] bg-[#F6F3EA] px-3 py-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 pr-2 text-sm font-semibold text-[#2B2A3D]">
                      {milestone.title}
                    </Text>
                    <Text className="text-xs font-semibold text-[#7A68E0]">{progressPercent}%</Text>
                  </View>
                  <Text className="mt-1 text-xs text-[#6B6A80]">
                    {milestone.currentValue}/{milestone.targetValue} complete •{' '}
                    {milestone.remaining} to go
                  </Text>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEE9DC]">
                    <View className="h-full bg-[#9B8CFF]" style={{ width: `${progressPercent}%` }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </BaseCard>
    </View>
  );
}
