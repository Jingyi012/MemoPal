import AnimatedPressable from '@/components/AnimatedPressable';
import { PremiumUpdateCard } from '@/components/PremiumUpdateCard';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { useUserState } from '@/contexts/UserStateContext';
import { useGamificationRewards } from '@/contexts/GamificationRewardContext';
import { SourceType } from '@/enums/sourceType';
import { BADGE_KEYS, useAllBadges } from '@/hooks/useBadges';
import { CURRENT_USER_KEYS, useCurrentUser } from '@/hooks/useCurrentUser';
import { useDueReviews } from '@/hooks/useDueReviews';
import { useFeatureLimits } from '@/hooks/useFeatureLimits';
import { useLevelByXp } from '@/hooks/useLevelConfigs';
import { MILESTONE_KEYS, useMilestones } from '@/hooks/useMilestones';
import { MISSION_KEYS, useMissions } from '@/hooks/useMissions';
import { usePalaceList } from '@/hooks/usePalace';
import { XP_KEYS, useTotalXp, useXpEvents } from '@/hooks/useXpEvents';
import { HomeHeader } from '@/screens/Home/Header/HomeHeader';
import { claimMissionReward, getMissionClaimSourceId } from '@/services/mission.service';
import { MissionProgress } from '@/types/missions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { DailyTip } from './DailyTip';
import { ReviewDueBadge } from './ReviewDueBadge';

const QuickAction = ({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) => (
  <AnimatedPressable onPress={onPress} className="mb-2 rounded-2xl bg-white p-4">
    <Text className="font-bold text-slate-800">{title}</Text>
    <Text className="mt-0.5 text-xs text-slate-500">{subtitle}</Text>
  </AnimatedPressable>
);

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { limits: featureLimits } = useFeatureLimits();
  const queryClient = useQueryClient();
  const { totalXp } = useTotalXp();
  const { events: xpEvents } = useXpEvents();
  const { levelInfo } = useLevelByXp(totalXp);
  const { milestones } = useMilestones();
  const { badges } = useAllBadges();
  const { missions } = useMissions();
  const { dueReviews } = useDueReviews();
  const { data: palaces = [] } = usePalaceList();
  const { userState, updateState } = useUserState();
  const { showRewards } = useGamificationRewards();
  const [claimingMissionKey, setClaimingMissionKey] = useState<string | null>(null);

  const showTutorialPrompt = !userState.ui.tutorialPromptDismissed;
  const canCreateCustomPalace = featureLimits.customPalaces > 0;

  const overdueCount = dueReviews.filter((r) => new Date(r.dueDate).getTime() < Date.now()).length;
  const dueCount = dueReviews.length;

  const achievedMilestones = milestones.filter((m) => !!m.achievedAt).length;
  const earnedBadges = badges.filter((b) => !!b.earnedAt).length;

  const headerUser = user
    ? {
        ...user,
        totalXp,
        level: levelInfo?.currentLevel ?? user.level,
      }
    : {
        id: 'guest',
        displayName: 'Guest',
        email: 'guest@local',
        totalXp: 0,
        level: 1,
        isPremium: false,
      };

  const stats = headerUser.stats;
  const metricValue = (conditionType?: string) => {
    switch (conditionType) {
      case 'level':
        return headerUser.level;
      case 'total_xp':
        return totalXp;
      case 'lessons_completed':
        return stats?.lessonsCompleted ?? 0;
      case 'words_learned':
        return stats?.wordsLearned ?? 0;
      case 'streak_days':
        return stats?.currentStreak ?? 0;
      default:
        return 0;
    }
  };

  const nextMilestone = milestones
    .filter((m) => !m.achievedAt)
    .map((m) => {
      const current = metricValue(m.conditionType);
      const target = m.conditionValue ?? 0;
      const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      return { ...m, current, target, progress, remaining: Math.max(0, target - current) };
    })
    .sort((a, b) => a.remaining - b.remaining)[0];

  const activeMissions = missions
    .filter((mission) => mission.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 3);

  const claimedMissionSourceIds = useMemo(() => {
    return new Set(
      xpEvents
        .filter((event) => event.sourceType === SourceType.MissionComplete && !!event.sourceId && !event.isDeleted)
        .map((event) => event.sourceId as string)
    );
  }, [xpEvents]);

  const claimMissionMutation = useMutation({
    mutationFn: async (mission: MissionProgress) => {
      setClaimingMissionKey(mission.key);
      return await claimMissionReward(mission);
    },
    onSuccess: (result) => {
      if (!result.wasAlreadyClaimed) {
        showRewards({
          levelUpTo: result.levelUpTo,
          milestones: result.achievedMilestones,
          badges: result.earnedBadges,
        });
      }
      queryClient.invalidateQueries({ queryKey: XP_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BADGE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MISSION_KEYS.all });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to claim mission reward right now.';
      Alert.alert('Claim failed', message);
    },
    onSettled: () => {
      setClaimingMissionKey(null);
    },
  });

  return (
    <View className="flex-1 bg-slate-50">
      <HomeHeader userData={headerUser} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-4">
          {/* {isFirstTime && <PalaceTrainingCard />} */}

          {showTutorialPrompt && (
            <View className="mt-3">
              <TutorialPromptCard
                dismissTutorialPrompt={() =>
                  updateState({
                    ui: { ...userState.ui, tutorialPromptDismissed: true },
                  })
                }
                onViewTutorial={() =>
                  updateState({
                    ui: {
                      ...userState.ui,
                      tutorialPromptDismissed: true,
                      tutorialViewedAt: new Date().toISOString(),
                    },
                  })
                }
              />
            </View>
          )}

          <ReviewDueBadge
            dueCount={dueCount}
            overdueCount={overdueCount}
            onPress={() => router.push('/(tabs)/palaces')}
          />

          <View className="mt-4 rounded-2xl bg-teal-600 p-4">
            <Text className="text-lg font-bold text-white">Daily Focus</Text>
            <Text className="mt-1 text-sm text-teal-100">
              {dueCount > 0
                ? `${dueCount} review${dueCount > 1 ? 's' : ''} waiting for you`
                : 'No due review right now. Continue learning to build momentum.'}
            </Text>
            <AnimatedPressable
              onPress={() => router.push('/(tabs)/palaces')}
              className="mt-3 self-start rounded-xl bg-white px-4 py-2">
              <Text className="font-semibold text-teal-700">
                {dueCount > 0 ? 'Review Now' : 'Browse Palaces'}
              </Text>
            </AnimatedPressable>
          </View>

          {activeMissions.length > 0 ? (
            <View className="mt-4 rounded-2xl bg-white p-4">
              <Text className="text-base font-bold text-slate-900">Mission Board</Text>
              <Text className="mt-1 text-sm text-slate-500">
                Focus on these missions to improve retention and consistency.
              </Text>
              {activeMissions.map((mission) => (
                <View key={mission.key} className="mt-3 rounded-xl bg-slate-50 p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-slate-800">{mission.title}</Text>
                    <Text className="text-xs font-semibold text-teal-700">+{mission.rewardXp} XP</Text>
                  </View>
                  {!!mission.description && (
                    <Text className="mt-1 text-xs text-slate-500">{mission.description}</Text>
                  )}
                  <Text className="mt-1 text-xs text-slate-500">
                    {mission.currentValue}/{mission.targetValue} completed
                  </Text>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <View className="h-full bg-teal-500" style={{ width: `${mission.progressPercent}%` }} />
                  </View>
                  {(() => {
                    const sourceId = getMissionClaimSourceId(mission);
                    const isClaimed = claimedMissionSourceIds.has(sourceId);
                    const canClaim = mission.isCompleted && !isClaimed && mission.rewardXp > 0;
                    const isClaiming = claimingMissionKey === mission.key && claimMissionMutation.isPending;

                    if (canClaim) {
                      return (
                        <AnimatedPressable
                          onPress={() => claimMissionMutation.mutate(mission)}
                          className="mt-3 items-center rounded-lg bg-teal-600 px-3 py-2">
                          <Text className="text-xs font-semibold text-white">
                            {isClaiming ? 'Claiming...' : 'Claim Reward'}
                          </Text>
                        </AnimatedPressable>
                      );
                    }

                    if (mission.isCompleted && isClaimed) {
                      return (
                        <Text className="mt-3 text-xs font-semibold text-emerald-700">
                          Reward claimed
                        </Text>
                      );
                    }

                    return (
                      <Text className="mt-3 text-xs text-slate-500">Complete mission to claim reward</Text>
                    );
                  })()}
                </View>
              ))}
            </View>
          ) : null}

          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-white p-3">
              <Text className="text-xs text-slate-500">Current XP</Text>
              <Text className="mt-1 text-lg font-bold text-slate-900">{totalXp}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white p-3">
              <Text className="text-xs text-slate-500">Palaces Available</Text>
              <Text className="mt-1 text-lg font-bold text-slate-900">{palaces.length}</Text>
            </View>
          </View>

          {nextMilestone ? (
            <View className="mt-4 rounded-2xl bg-white p-4">
              <Text className="text-base font-bold text-slate-900">Next Milestone</Text>
              <Text className="mt-1 text-sm font-semibold text-slate-700">
                {nextMilestone.title}
              </Text>
              {!!nextMilestone.description && (
                <Text className="mt-1 text-sm text-slate-500">{nextMilestone.description}</Text>
              )}
              <Text className="mt-1 text-xs text-slate-500">
                {nextMilestone.current}/{nextMilestone.target} • {nextMilestone.remaining} to go
              </Text>
              <View className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <View
                  className="h-full bg-teal-500"
                  style={{ width: `${nextMilestone.progress}%` }}
                />
              </View>
              <Text className="mt-2 text-right text-xs font-semibold text-slate-500">
                {nextMilestone.progress}% complete
              </Text>
            </View>
          ) : null}

          <View className="mt-4 rounded-2xl bg-white p-4">
            <Text className="text-base font-bold text-slate-900">Achievements Snapshot</Text>
            <Text className="mt-2 text-sm text-slate-600">
              {earnedBadges} badges earned • {achievedMilestones} milestones unlocked
            </Text>
            <Text
              onPress={() => router.push('/(tabs)/badges')}
              className="mt-3 text-sm font-semibold text-teal-700">
              View Achievements →
            </Text>
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-base font-bold text-slate-800">Quick Actions</Text>
            <QuickAction
              title="Browse Palaces"
              subtitle="Choose a palace and continue your journey"
              onPress={() => router.push('/(tabs)/palaces')}
            />
            <QuickAction
              title="Review Session"
              subtitle="Practice due items and keep streak alive"
              onPress={() => router.push('/(tabs)/palaces')}
            />
            {canCreateCustomPalace ? (
              <QuickAction
                title="Create Custom Palace"
                subtitle="Create your own visual memory map"
                onPress={() => router.push('/palaces/create')}
              />
            ) : null}
          </View>

          <DailyTip />

          {!user?.isPremium && !canCreateCustomPalace ? <PremiumUpdateCard className="mt-4" /> : null}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
