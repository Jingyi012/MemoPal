import AnimatedPressable from '@/components/AnimatedPressable';
import { BaseCard } from '@/components/BaseCard';
import { SourceType } from '@/enums/sourceType';
import { getMissionClaimSourceId, useClaimMissionReward } from '@/features/gamification/shared/hooks/useMissions';
import { useXpEvents } from '@/features/gamification/shared/hooks/useXpEvents';
import { MissionProgress } from '@/features/gamification/shared/types/missions';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
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
  icon: string;
  textColor: string;
  bgClass: string;
} {
  switch (status) {
    case 'claimable':
      return {
        label: 'Ready to claim',
        icon: '🎁',
        textColor: theme.violetDeep,
        bgClass: 'bg-[#EEE9FF]',
      };
    case 'claimed':
      return {
        label: 'Claimed',
        icon: '✅',
        textColor: theme.grass,
        bgClass: 'bg-[#F1FBF5]',
      };
    default:
      return {
        label: 'In progress',
        icon: '⏰',
        textColor: theme.inkSoft,
        bgClass: 'bg-[#F6F3EA]',
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

  return (
    <BaseCard className="border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4" padding="none">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="mb-1 flex-row items-center gap-2">
              <View className="rounded-full bg-[#EEE9FF] p-1.5">
              <Text className="text-xs">🎯</Text>
            </View>
            <Text className="text-base font-semibold text-[#2B2A3D]">{mission.title}</Text>
          </View>
          {!!mission.description && (
            <Text className="text-sm text-[#6B6A80]">{mission.description}</Text>
          )}
        </View>
        <View className="rounded-full bg-[#FFF7E0] px-3 py-1">
          <Text className="text-sm font-semibold text-[#F2A900]">+{mission.rewardXp} XP</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${meta.bgClass}`}>
          <Text className="text-xs">{meta.icon}</Text>
          <Text className="text-xs font-semibold" style={{ color: meta.textColor }}>
            {meta.label}
          </Text>
        </View>
        <Text className="text-xs font-semibold uppercase text-[#6B6A80]">
          {formatPeriod(mission.period)}
        </Text>
      </View>

      <View className="mt-3">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-xs text-[#6B6A80]">
            {mission.currentValue}/{mission.targetValue}
          </Text>
          <Text className="text-xs font-semibold text-[#7A68E0]">{mission.progressPercent}%</Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-[#EEE9DC]">
          <View
            className={`h-full ${status === 'claimed' ? 'bg-[#3FB87F]' : 'bg-[#9B8CFF]'}`}
            style={{ width: `${mission.progressPercent}%` }}
          />
        </View>
      </View>

      {canClaim ? (
        <AnimatedPressable
          onPress={onClaim}
          className="mt-3 items-center rounded-xl bg-[#FFC93C] px-3 py-2">
          <Text className="text-sm font-semibold text-[#2B2A3D]">
            {isClaiming ? 'Claiming...' : 'Claim Reward'}
          </Text>
        </AnimatedPressable>
      ) : status === 'claimed' ? (
        <Text className="mt-3 text-sm font-semibold text-[#3FB87F]">Reward already claimed</Text>
      ) : (
        <Text className="mt-3 text-sm text-[#6B6A80]">Complete this mission to claim reward</Text>
      )}
    </BaseCard>
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
      const isClaimedFromMission = Boolean(mission.isClaimed);
      const isClaimedFromEvents = claimedMissionSourceIds.has(sourceId);
      const isClaimed = isClaimedFromMission || isClaimedFromEvents;
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
    <BaseCard className="border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4" padding="none">
      <Text className="text-base font-bold text-[#2B2A3D]">{sectionTitle}</Text>
      <Text className="mt-1 text-sm text-[#6B6A80]">{sectionDescription}</Text>

      <View className="mt-3 flex-row gap-2">
        <View className="flex-1 rounded-xl bg-[#F6F3EA] px-3 py-2">
          <Text className="text-sm text-[#6B6A80]">Active</Text>
          <Text className="mt-1 text-lg font-bold text-[#2B2A3D]">{missions.length}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-[#EEE9FF] px-3 py-2">
          <Text className="text-sm text-[#7A68E0]">Claimable</Text>
          <Text className="mt-1 text-lg font-bold text-[#7A68E0]">{claimableCount}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-[#F1FBF5] px-3 py-2">
          <Text className="text-sm text-[#3FB87F]">Claimed</Text>
          <Text className="mt-1 text-lg font-bold text-[#3FB87F]">{claimedCount}</Text>
        </View>
      </View>

      {isError ? (
        <View className="mt-4 rounded-2xl border border-[#FFD9E2] bg-[#FFF0F4] p-4">
          <Text className="text-sm font-semibold text-[#E8527A]">
            Unable to load missions right now.
          </Text>
          <AnimatedPressable
            onPress={onRetry}
            className="mt-3 self-start rounded-lg bg-[#E8527A] px-3 py-2">
            <Text className="text-sm font-semibold text-white">Retry</Text>
          </AnimatedPressable>
        </View>
      ) : null}

      {!isError && missions.length === 0 ? (
        <View className="mt-3 rounded-xl bg-[#F6F3EA] px-3 py-2">
          <Text className="text-sm text-[#6B6A80]">No active missions right now.</Text>
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
          <Text className="text-sm">✨</Text>
          <Text className="text-sm text-[#6B6A80]">Syncing mission rewards...</Text>
        </View>
      ) : null}
    </BaseCard>
  );
}
