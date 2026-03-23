import AnimatedPressable from '@/components/AnimatedPressable';
import { useGamificationRewards } from '@/contexts/GamificationRewardContext';
import { SourceType } from '@/enums/sourceType';
import { BADGE_KEYS } from '@/hooks/useBadges';
import { CURRENT_USER_KEYS } from '@/hooks/useCurrentUser';
import { MILESTONE_KEYS } from '@/hooks/useMilestones';
import { MISSION_KEYS } from '@/hooks/useMissions';
import { XP_KEYS, useXpEvents } from '@/hooks/useXpEvents';
import { claimMissionReward, getMissionClaimSourceId } from '@/services/mission.service';
import { MissionProgress } from '@/types/missions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

function MissionCard({
  mission,
  isClaimed,
  isClaiming,
  onClaim,
}: {
  mission: MissionProgress;
  isClaimed: boolean;
  isClaiming: boolean;
  onClaim: () => void;
}) {
  const canClaim = mission.isCompleted && !isClaimed && mission.rewardXp > 0;

  return (
    <View className="rounded-2xl bg-slate-50 p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-slate-900">{mission.title}</Text>
          {!!mission.description && <Text className="mt-1 text-sm text-slate-500">{mission.description}</Text>}
        </View>
        <View className="rounded-full bg-teal-50 px-3 py-1">
          <Text className="text-sm font-semibold text-teal-700">+{mission.rewardXp} XP</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">{mission.period}</Text>
        <Text className="text-sm text-slate-500">
          {mission.currentValue}/{mission.targetValue}
        </Text>
      </View>
      <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <View className="h-full bg-teal-500" style={{ width: `${mission.progressPercent}%` }} />
      </View>

      {canClaim ? (
        <AnimatedPressable onPress={onClaim} className="mt-3 items-center rounded-xl bg-teal-600 px-3 py-2">
          <Text className="text-sm font-semibold text-white">{isClaiming ? 'Claiming...' : 'Claim Reward'}</Text>
        </AnimatedPressable>
      ) : mission.isCompleted && isClaimed ? (
        <Text className="mt-3 text-sm font-semibold text-emerald-700">Reward claimed</Text>
      ) : (
        <Text className="mt-3 text-sm text-slate-500">Complete mission to claim reward</Text>
      )}
    </View>
  );
}

interface MissionsTabProps {
  missions: MissionProgress[];
  isError: boolean;
  onRetry: () => void;
  sectionTitle: string;
  sectionDescription: string;
}

export function MissionsTab({ missions, isError, onRetry, sectionTitle, sectionDescription }: MissionsTabProps) {
  const queryClient = useQueryClient();
  const { showRewards } = useGamificationRewards();
  const { events: xpEvents, isLoading: isXpEventsLoading } = useXpEvents();
  const [claimingMissionKey, setClaimingMissionKey] = useState<string | null>(null);

  const completedCount = useMemo(() => missions.filter((mission) => mission.isCompleted).length, [missions]);

  const claimedMissionSourceIds = useMemo(() => {
    return new Set(
      xpEvents
        .filter(
          (event) =>
            event.sourceType === SourceType.MissionComplete &&
            !!event.sourceId &&
            !event.isDeleted
        )
        .map((event) => event.sourceId as string)
    );
  }, [xpEvents]);

  const claimableCount = useMemo(
    () =>
      missions.filter((mission) => {
        const sourceId = getMissionClaimSourceId(mission);
        return mission.isCompleted && !claimedMissionSourceIds.has(sourceId) && mission.rewardXp > 0;
      }).length,
    [missions, claimedMissionSourceIds]
  );

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
      Toast.show({
        type: 'error',
        text1: 'Claim failed',
        text2: message,
      });
    },
    onSettled: () => {
      setClaimingMissionKey(null);
    },
  });

  return (
    <View className="rounded-2xl bg-white p-4">
      <Text className="text-base font-bold text-slate-900">{sectionTitle}</Text>
      <Text className="mt-1 text-sm text-slate-500">{sectionDescription}</Text>

      <View className="mt-3 flex-row gap-2">
        <View className="flex-1 rounded-xl bg-slate-100 px-3 py-2">
          <Text className="text-sm text-slate-500">Active</Text>
          <Text className="mt-1 text-lg font-bold text-slate-900">{missions.length}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-emerald-50 px-3 py-2">
          <Text className="text-sm text-emerald-700">Completed</Text>
          <Text className="mt-1 text-lg font-bold text-emerald-700">{completedCount}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-teal-50 px-3 py-2">
          <Text className="text-sm text-teal-700">Claimable</Text>
          <Text className="mt-1 text-lg font-bold text-teal-700">{claimableCount}</Text>
        </View>
      </View>

      {isError ? (
        <View className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <Text className="text-sm font-semibold text-rose-700">Unable to load missions right now.</Text>
          <AnimatedPressable onPress={onRetry} className="mt-3 self-start rounded-lg bg-rose-600 px-3 py-2">
            <Text className="text-sm font-semibold text-white">Retry</Text>
          </AnimatedPressable>
        </View>
      ) : null}

      {!isError && missions.length === 0 ? (
        <View className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
          <Text className="text-sm text-slate-500">No active missions right now.</Text>
        </View>
      ) : null}

      {!isError && missions.length > 0 ? (
        <View className="mt-3 gap-2">
          {missions.map((mission) => {
            const sourceId = getMissionClaimSourceId(mission);
            const isClaimed = claimedMissionSourceIds.has(sourceId);
            const isClaiming = claimingMissionKey === mission.key && claimMissionMutation.isPending;

            return (
              <MissionCard
                key={mission.key}
                mission={mission}
                isClaimed={isClaimed}
                isClaiming={isClaiming}
                onClaim={() => claimMissionMutation.mutate(mission)}
              />
            );
          })}
        </View>
      ) : null}

      {isXpEventsLoading ? (
        <Text className="mt-3 text-sm text-slate-500">Syncing mission rewards...</Text>
      ) : null}
    </View>
  );
}

