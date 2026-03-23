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

export function OverviewTab({
  totalBadgeEarned,
  totalMilestonesAchieved,
  completedMissions,
  totalActiveMissions,
  recentBadges,
  upcomingMilestones,
}: OverviewTabProps) {
  return (
    <View className="gap-3">
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-base font-bold text-slate-900">Overview</Text>
        <Text className="mt-1 text-sm text-slate-500">See your achievement status at a glance.</Text>
        <View className="mt-3 flex-row gap-2">
          <View className="flex-1 rounded-xl bg-amber-50 px-3 py-2">
            <Text className="text-sm text-amber-700">Badges Earned</Text>
            <Text className="mt-1 text-lg font-bold text-amber-700">{totalBadgeEarned}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-indigo-50 px-3 py-2">
            <Text className="text-sm text-indigo-700">Milestones Achieved</Text>
            <Text className="mt-1 text-lg font-bold text-indigo-700">{totalMilestonesAchieved}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-teal-50 px-3 py-2">
            <Text className="text-sm text-teal-700">Missions Done</Text>
            <Text className="mt-1 text-lg font-bold text-teal-700">
              {completedMissions}/{totalActiveMissions}
            </Text>
          </View>
        </View>
      </View>

      <View className="rounded-2xl bg-white p-4">
        <Text className="text-sm font-semibold text-slate-800">Recent Badges</Text>
        {recentBadges.length === 0 ? (
          <Text className="mt-2 text-sm text-slate-500">No badges earned yet.</Text>
        ) : (
          <View className="mt-2 flex-row flex-wrap gap-2">
            {recentBadges.map((badge) => (
              <View key={badge.id} className="rounded-full bg-amber-50 px-3 py-1">
                <Text className="text-sm font-semibold text-amber-700">{badge.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="rounded-2xl bg-white p-4">
        <Text className="text-sm font-semibold text-slate-800">Upcoming Milestones</Text>
        {upcomingMilestones.length === 0 ? (
          <Text className="mt-2 text-sm text-slate-500">All milestones are completed.</Text>
        ) : (
          <View className="mt-2 gap-2">
            {upcomingMilestones.map((milestone) => (
              <View key={milestone.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <Text className="text-sm font-semibold text-slate-700">{milestone.title}</Text>
                <Text className="mt-1 text-sm text-slate-500">
                  {milestone.currentValue}/{milestone.targetValue} ({milestone.remaining} to go)
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

