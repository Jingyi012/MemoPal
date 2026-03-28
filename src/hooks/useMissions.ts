import { BADGE_KEYS } from '@/hooks/useBadges';
import { CURRENT_USER_KEYS } from '@/hooks/useCurrentUser';
import { MILESTONE_KEYS } from '@/hooks/useMilestones';
import { PALACE_KEYS } from '@/hooks/usePalace';
import {
  claimMissionReward,
  getCurrentMissionDashboard,
  getMissionClaimSourceId,
} from '@/services/mission.service';
import { MissionProgress } from '@/types/missions';
import { XP_KEYS } from './useXpEvents';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const MISSION_KEYS = {
  all: ['missions'] as const,
  current: () => [...MISSION_KEYS.all, 'current'] as const,
};

export function useMissions() {
  const query = useQuery({
    queryKey: MISSION_KEYS.current(),
    queryFn: () => getCurrentMissionDashboard(),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  });

  return {
    missions: query.data?.missions ?? [],
    generatedAtUtc: query.data?.generatedAtUtc ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useClaimMissionReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mission: MissionProgress) => claimMissionReward(mission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: XP_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BADGE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PALACE_KEYS.all });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MISSION_KEYS.all });
    },
  });
}

export { getMissionClaimSourceId };
