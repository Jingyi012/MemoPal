import { milestoneApi } from '@/features/gamification/shared/api/milestone';
import { Milestone } from '@/features/gamification/shared/types/milestone';

export async function getMilestones(params: Record<string, never> = {}): Promise<Milestone[]> {
  return (await milestoneApi.getAll(params)) ?? [];
}

export async function getMilestoneById(id: string) {
  return milestoneApi.getById(id);
}

export async function hasAchieved(milestoneId: string): Promise<boolean> {
  return Boolean((await milestoneApi.getById(milestoneId)).achievedAt);
}
