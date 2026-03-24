import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { useGamificationRewards } from '@/contexts/GamificationRewardContext';
import { SourceType } from '@/enums/sourceType';
import { getMissionClaimSourceId, useClaimMissionReward } from '@/hooks/useMissions';
import { useXpEvents } from '@/hooks/useXpEvents';
import { MissionProgress } from '@/types/missions';
import { CheckCircle2, Clock3, Gift, Sparkles, Target } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

type MissionStatus = 'claimable' | 'in_progress' | 'claimed';

function resolveMissionStatus(mission: MissionProgress, isClaimed: boolean): MissionStatus {
  if (isClaimed) return 'claimed';
  if (mission.isCompleted) return 'claimable';
  return 'in_progress';
}

function statusMeta(status: MissionStatus): {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  textColor: string;
  bgClass: string;
} {
  switch (status) {
    case 'claimable':
      return {
        label: 'Ready to claim',
        icon: Gift,
        textColor: Colors.teal700,
        bgClass: 'bg-teal-100',
      };
    case 'claimed':
      return {
        label: 'Claimed',
        icon: CheckCircle2,
        textColor: Colors.emerald700,
        bgClass: 'bg-emerald-100',
      };
    default:
      return {
        label: 'In progress',
        icon: Clock3,
        textColor: Colors.slate700,
        bgClass: 'bg-slate-200',
      };
  }
}

const formatPeriod = (period: string) => {
  let pn = period;
  switch (period) {
    case 'daily': {
      pn = 'Daily';
      break;
    }
    case 'weekly': {
      pn = 'Weekly';
      break;
    }
    case 'all_time': {
      pn = 'All Time';
      break;
    }
  }
  return pn;
};

function MissionCard({
  mission,
  status,
  isClaiming,
  onClaim,
}: {
  mission: MissionProgress;
  status: MissionStatus;
  isClaiming: boolean;
  onClaim: () => void;
}) {
  const canClaim = status === 'claimable' && mission.rewardXp > 0;
  const meta = statusMeta(status);
  const StatusIcon = meta.icon;

  return (
    <View className="rounded-2xl border border-slate-100 bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="mb-1 flex-row items-center gap-2">
            <View className="rounded-full bg-indigo-100 p-1.5">
              <Target size={12} color={Colors.indigo700} />
            </View>
            <Text className="text-base font-semibold text-slate-900">{mission.title}</Text>
          </View>
          {!!mission.description && (
            <Text className="text-sm text-slate-500">{mission.description}</Text>
          )}
        </View>
        <View className="rounded-full bg-amber-100 px-3 py-1">
          <Text className="text-sm font-semibold text-amber-700">+{mission.rewardXp} XP</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${meta.bgClass}`}>
          <StatusIcon size={12} color={meta.textColor} />
          <Text className="text-xs font-semibold" style={{ color: meta.textColor }}>
            {meta.label}
          </Text>
        </View>
        <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {formatPeriod(mission.period)}
        </Text>
      </View>

      <View className="mt-3">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-xs text-slate-500">
            {mission.currentValue}/{mission.targetValue}
          </Text>
          <Text className="text-xs font-semibold text-slate-600">{mission.progressPercent}%</Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-slate-200">
          <View
            className={`h-full ${status === 'claimed' ? 'bg-emerald-500' : 'bg-teal-500'}`}
            style={{ width: `${mission.progressPercent}%` }}
          />
        </View>
      </View>

      {canClaim ? (
        <AnimatedPressable
          onPress={onClaim}
          className="mt-3 items-center rounded-xl bg-teal-600 px-3 py-2">
          <Text className="text-sm font-semibold text-white">
            {isClaiming ? 'Claiming...' : 'Claim Reward'}
          </Text>
        </AnimatedPressable>
      ) : status === 'claimed' ? (
        <Text className="mt-3 text-sm font-semibold text-emerald-700">Reward already claimed</Text>
      ) : (
        <Text className="mt-3 text-sm text-slate-500">Complete this mission to claim reward</Text>
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

export function MissionsTab({
  missions,
  isError,
  onRetry,
  sectionTitle,
  sectionDescription,
}: MissionsTabProps) {
  const { showRewards } = useGamificationRewards();
  const { events: xpEvents, isLoading: isXpEventsLoading } = useXpEvents();
  const [claimingMissionKey, setClaimingMissionKey] = useState<string | null>(null);
  const claimMissionMutation = useClaimMissionReward();

  const claimedMissionSourceIds = useMemo(() => {
    return new Set(
      xpEvents
        .filter(
          (event) =>
            event.sourceType === SourceType.MissionComplete && !!event.sourceId && !event.isDeleted
        )
        .map((event) => event.sourceId as string)
    );
  }, [xpEvents]);

  const missionViewModels = useMemo(() => {
    return missions.map((mission) => {
      const sourceId = getMissionClaimSourceId(mission);
      const isClaimed = claimedMissionSourceIds.has(sourceId);
      const status = resolveMissionStatus(mission, isClaimed);
      return { mission, sourceId, isClaimed, status };
    });
  }, [claimedMissionSourceIds, missions]);

  const orderedMissionItems = useMemo(() => {
    const statusRank: Record<MissionStatus, number> = {
      claimable: 0,
      in_progress: 1,
      claimed: 2,
    };

    return [...missionViewModels].sort((a, b) => {
      const rankDiff = statusRank[a.status] - statusRank[b.status];
      if (rankDiff !== 0) return rankDiff;

      if (a.status === 'in_progress' && b.status === 'in_progress') {
        return b.mission.progressPercent - a.mission.progressPercent;
      }

      return a.mission.sortOrder - b.mission.sortOrder;
    });
  }, [missionViewModels]);

  const claimableCount = useMemo(
    () =>
      missionViewModels.filter((item) => item.status === 'claimable' && item.mission.rewardXp > 0)
        .length,
    [missionViewModels]
  );

  const claimedCount = useMemo(
    () => missionViewModels.filter((item) => item.status === 'claimed').length,
    [missionViewModels]
  );

  return (
    <View className="rounded-2xl bg-white p-4">
      <Text className="text-base font-bold text-slate-900">{sectionTitle}</Text>
      <Text className="mt-1 text-sm text-slate-500">{sectionDescription}</Text>

      <View className="mt-3 flex-row gap-2">
        <View className="flex-1 rounded-xl bg-slate-100 px-3 py-2">
          <Text className="text-sm text-slate-500">Active</Text>
          <Text className="mt-1 text-lg font-bold text-slate-900">{missions.length}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-teal-50 px-3 py-2">
          <Text className="text-sm text-teal-700">Claimable</Text>
          <Text className="mt-1 text-lg font-bold text-teal-700">{claimableCount}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-emerald-50 px-3 py-2">
          <Text className="text-sm text-emerald-700">Claimed</Text>
          <Text className="mt-1 text-lg font-bold text-emerald-700">{claimedCount}</Text>
        </View>
      </View>

      {isError ? (
        <View className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <Text className="text-sm font-semibold text-rose-700">
            Unable to load missions right now.
          </Text>
          <AnimatedPressable
            onPress={onRetry}
            className="mt-3 self-start rounded-lg bg-rose-600 px-3 py-2">
            <Text className="text-sm font-semibold text-white">Retry</Text>
          </AnimatedPressable>
        </View>
      ) : null}

      {!isError && missions.length === 0 ? (
        <View className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
          <Text className="text-sm text-slate-500">No active missions right now.</Text>
        </View>
      ) : null}

      {!isError && orderedMissionItems.length > 0 ? (
        <View className="mt-3 gap-2">
          {orderedMissionItems.map(({ mission, status }) => {
            const isClaiming = claimingMissionKey === mission.key && claimMissionMutation.isPending;

            return (
              <MissionCard
                key={mission.key}
                mission={mission}
                status={status}
                isClaiming={isClaiming}
                onClaim={() => {
                  setClaimingMissionKey(mission.key);
                  claimMissionMutation.mutate(mission, {
                    onSuccess: (result) => {
                      if (!result.wasAlreadyClaimed) {
                        showRewards({
                          levelUpTo: result.levelUpTo,
                          milestones: result.achievedMilestones,
                          badges: result.earnedBadges,
                        });
                      }
                    },
                    onError: (error) => {
                      const message =
                        error instanceof Error
                          ? error.message
                          : 'Unable to claim mission reward right now.';
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
                }}
              />
            );
          })}
        </View>
      ) : null}

      {isXpEventsLoading ? (
        <View className="mt-3 flex-row items-center gap-2">
          <Sparkles size={14} color={Colors.slate500} />
          <Text className="text-sm text-slate-500">Syncing mission rewards...</Text>
        </View>
      ) : null}
    </View>
  );
}
