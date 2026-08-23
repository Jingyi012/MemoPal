import { milestoneApi } from '@/features/gamification/shared/api/milestone';
import { Milestone } from '@/features/gamification/shared/types/levelAndbadge';

export async function getMilestones(params: Record<string, never> = {}): Promise<Milestone[]> {
  return (await milestoneApi.getAll(params)) ?? [];
}

export async function getMilestoneById(id: string) {
  return milestoneApi.getById(id);
}

export async function awardMilestone(milestoneId: string): Promise<void> {
  await milestoneApi.awardMilestone(milestoneId);
}

export async function hasAchieved(milestoneId: string): Promise<boolean> {
  return Boolean((await milestoneApi.getById(milestoneId)).achievedAt);
}
