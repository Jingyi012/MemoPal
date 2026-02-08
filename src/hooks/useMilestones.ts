import { useMilestoneRepository } from '@/repositories/milestone.repo';
import { MilestoneService } from '@/services/milestone.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const MILESTONE_KEYS = {
  all: ['milestones'] as const,
  list: () => [...MILESTONE_KEYS.all, 'list'] as const,
  userMilestones: (userId: string) => [...MILESTONE_KEYS.all, 'user', userId] as const,
};

export function useMilestones() {
  const repo = useMilestoneRepository();

  const query = useQuery({
    queryKey: MILESTONE_KEYS.list(),
    queryFn: async () => {
      const response = await MilestoneService.getMilestones({});

      if (response.data && response.data.length > 0) {
        const repo = useMilestoneRepository();
        await repo.upsertMany(response.data);
      }

      return await repo.getAll();
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    milestones: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useUserMilestones(userId: string) {
  const repo = useMilestoneRepository();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: MILESTONE_KEYS.userMilestones(userId),
    enabled: !!userId,
    queryFn: async () => {
      const response = await MilestoneService.getUserMilestones(userId);

      if (response.data && response.data.length > 0) {
        const repo = useMilestoneRepository();
        await repo.upsertUserMilestones(
          userId,
          response.data.map((milestone: any) => ({
            milestoneId: milestone.id,
            achievedAt: milestone.achievedAt || new Date().toISOString(),
          }))
        );
      }

      const userMilestones = await repo.getUserMilestones(userId);
      return userMilestones;
    },
    staleTime: 1000 * 60 * 5,
  });

  const awardMilestone = async (milestoneId: string) => {
    await repo.awardMilestone(userId, milestoneId);
    queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.userMilestones(userId) });
  };

  return {
    userMilestones: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    awardMilestone,
  };
}
