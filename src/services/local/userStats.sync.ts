/**
 * Local sync service for user statistics
 * Syncs user stats data from API to local database
 */

import { useUserStatsRepository } from '@/repositories/userStats.repo';
import { UserStatsService } from '../userStats.service';

export class UserStatsSyncService {
  /**
   * Sync user statistics from API to local storage
   */
  static async syncUserStats(userId: string) {
    try {
      const stats = await UserStatsService.getUserStats(userId);

      if (stats) {
        const repo = useUserStatsRepository();
        await repo.upsertMany([stats]);
        return stats;
      }
    } catch (error) {
      console.error('Failed to sync user stats:', error);
      throw error;
    }
  }

  /**
   * Sync multiple user stats from API to local storage
   */
  static async syncMultipleStats(userStatsList: Array<{ userId: string }>) {
    try {
      const allStats = await Promise.all(
        userStatsList.map((item) => UserStatsService.getUserStats(item.userId))
      );

      if (allStats.length > 0) {
        const repo = useUserStatsRepository();
        await repo.upsertMany(allStats);
        return allStats;
      }
    } catch (error) {
      console.error('Failed to sync multiple user stats:', error);
      throw error;
    }
  }

  /**
   * Get user level information and sync if needed
   */
  static async syncUserLevel(userId: string) {
    try {
      const levelInfo = await UserStatsService.getUserLevel(userId);
      return levelInfo;
    } catch (error) {
      console.error('Failed to sync user level:', error);
      throw error;
    }
  }
}
