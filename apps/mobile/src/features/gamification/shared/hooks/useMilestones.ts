import * as milestoneService from '@/features/gamification/shared/services/milestone.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const MILESTONE_KEYS = {
  all: ['milestones'] as const,
  lists: () => [...MILESTONE_KEYS.all, 'list'] as const,
  list: () => [...MILESTONE_KEYS.lists()] as const,
  details: () => [...MILESTONE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...MILESTONE_KEYS.details(), id] as const,
};

export function useMilestones() {
  const query = useQuery({
    queryKey: MILESTONE_KEYS.list(),
    queryFn: () => milestoneService.getMilestones({}),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return {
    milestones: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useMilestoneDetail(id: string) {
  const query = useQuery({
    queryKey: MILESTONE_KEYS.detail(id),
    queryFn: () => milestoneService.getMilestoneById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    milestone: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useMilestoneMutations() {
  const queryClient = useQueryClient();

  const awardMilestone = useMutation({
    mutationFn: ({ milestoneId }: { milestoneId: string }) =>
      milestoneService.awardMilestone(milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.all });
    },
  });

  return { awardMilestone };
}
