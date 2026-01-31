/**
 * Local sync service for milestones
 * Syncs milestone data from API to local database
 */

import { useMilestoneRepository } from '@/repositories/milestone.repo';
import { MilestoneService } from '../milestone.service';

export class MilestoneSyncService {
  /**
   * Sync all milestones from API to local storage
   */
  static async syncMilestones() {
    try {
      const response = await MilestoneService.getPagedMilestones({
        pageNumber: 1,
        pageSize: 1000,
      });

      if (response.data && response.data.length > 0) {
        const repo = useMilestoneRepository();
        await repo.upsertMany(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to sync milestones:', error);
      throw error;
    }
  }

  /**
   * Sync user milestones from API to local storage
   */
  static async syncUserMilestones(userId: string) {
    try {
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
        return response.data;
      }
    } catch (error) {
      console.error('Failed to sync user milestones:', error);
      throw error;
    }
  }
}
