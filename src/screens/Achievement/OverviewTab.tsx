import { Colors } from '@/constants/colors';
import { Award, Flag, Sparkles, Target } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

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
  Icon,
  iconColor,
  iconBgClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  iconBgClass: string;
}) {
  return (
    <View className="flex-1 flex-col rounded-2xl border border-slate-100 bg-white p-3">
      <View className="flex-col items-center justify-between">
        <View className={`mb-3 rounded-full p-2 ${iconBgClass}`}>
          <Icon size={14} color={iconColor} />
        </View>
        <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </Text>
      </View>
      <Text className="mt-3 text-center text-2xl font-bold text-slate-900">{value}</Text>
      <Text className="mt-1 text-center text-xs text-slate-500">{subtitle}</Text>
    </View>
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
  const missionCompletionPercent =
    totalActiveMissions > 0
      ? Math.max(0, Math.min(100, Math.round((completedMissions / totalActiveMissions) * 100)))
      : 0;

  return (
    <View className="gap-3">
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-bold text-slate-900">Overview</Text>
        <Text className="mt-1 text-sm text-slate-500">
          Quick view of your current progress and nearest wins.
        </Text>

        <View className="mt-4 flex-row gap-2">
          <SummaryCard
            title="Badges"
            value={`${totalBadgeEarned}`}
            subtitle="Earned so far"
            Icon={Award}
            iconColor={Colors.amber700}
            iconBgClass="bg-amber-100"
          />
          <SummaryCard
            title="Milestones"
            value={`${totalMilestonesAchieved}`}
            subtitle="Achieved"
            Icon={Flag}
            iconColor={Colors.indigo700}
            iconBgClass="bg-indigo-100"
          />
          <SummaryCard
            title="Missions"
            value={`${completedMissions}/${totalActiveMissions}`}
            subtitle={`${missionCompletionPercent}% completed`}
            Icon={Target}
            iconColor={Colors.teal700}
            iconBgClass="bg-teal-100"
          />
        </View>
      </View>

      <View className="rounded-2xl bg-white p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-800">Recent Badges</Text>
          <View className="rounded-full bg-amber-100 p-2">
            <Sparkles size={14} color={Colors.amber700} />
          </View>
        </View>
        {recentBadges.length === 0 ? (
          <Text className="mt-2 text-sm text-slate-500">No badges earned yet. Keep going.</Text>
        ) : (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {recentBadges.map((badge) => (
              <View
                key={badge.id}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
                <Text className="text-sm font-semibold text-amber-700">{badge.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="rounded-2xl bg-white p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-800">Upcoming Milestones</Text>
          <Text className="text-xs text-slate-500">Closest first</Text>
        </View>
        {upcomingMilestones.length === 0 ? (
          <Text className="mt-2 text-sm text-slate-500">All milestones are completed.</Text>
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
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 pr-2 text-sm font-semibold text-slate-800">
                      {milestone.title}
                    </Text>
                    <Text className="text-xs font-semibold text-slate-600">{progressPercent}%</Text>
                  </View>
                  <Text className="mt-1 text-xs text-slate-500">
                    {milestone.currentValue}/{milestone.targetValue} complete •{' '}
                    {milestone.remaining} to go
                  </Text>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <View className="h-full bg-teal-500" style={{ width: `${progressPercent}%` }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
