import { milestoneApi } from '@/api/milestone';
import { createMilestoneRepository } from '@/repositories/milestone.repo';
import { Milestone } from '@/types/levelAndbadge';

const repo = createMilestoneRepository();

export async function getMilestones(params: {} = {}): Promise<Milestone[]> {
  try {
    const remote = await milestoneApi.getAll(params);
    if (remote && remote.length > 0) {
      await repo.upsertMany(remote);
    }
  } catch (error) {
    console.warn('Failed to sync milestones from backend, using local data:', error);
  }

  return await repo.getAll();
}

export async function getMilestoneById(id: string) {
  try {
    const remote = await milestoneApi.getById(id);
    if (remote) {
      await repo.upsertMany([remote]);
    }
  } catch (error) {
    console.warn('Failed to sync milestone details, using local data:', error);
  }

  return await repo.getById(id);
}

export async function awardMilestone(milestoneId: string): Promise<void> {
  await repo.awardMilestone(milestoneId);
}

export async function hasAchieved(milestoneId: string): Promise<boolean> {
  return await repo.hasAchieved(milestoneId);
}

export async function syncPendingChanges(): Promise<void> {
  try {
    // Milestones are typically read-only from backend
    // Only user milestone awards need syncing, which is handled via sync queue
    console.log('Milestone sync queue handled by SyncBase');
  } catch (error) {
    console.error('Milestone sync error:', error);
  }
}
