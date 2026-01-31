/**
 * Local sync service for badges
 * Syncs badge data from API to local database
 */

import { useBadgeRepository } from '@/repositories/badge.repo';
import { BadgeService } from '../badge.service';

export class BadgeSyncService {
  /**
   * Sync all badges from API to local storage
   */
  static async syncBadges() {
    try {
      const response = await BadgeService.getPagedBadges({
        pageNumber: 1,
        pageSize: 1000,
      });

      if (response.data && response.data.length > 0) {
        const repo = useBadgeRepository();
        await repo.upsertMany(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to sync badges:', error);
      throw error;
    }
  }

  /**
   * Sync user badges from API to local storage
   */
  static async syncUserBadges(userId: string) {
    try {
      const response = await BadgeService.getUserBadges(userId);

      if (response.data && response.data.length > 0) {
        const repo = useBadgeRepository();
        await repo.upsertUserBadges(
          userId,
          response.data.map((badge: any) => ({
            badgeId: badge.id,
            earnedAt: badge.earnedAt || new Date().toISOString(),
          }))
        );
        return response.data;
      }
    } catch (error) {
      console.error('Failed to sync user badges:', error);
      throw error;
    }
  }
}
