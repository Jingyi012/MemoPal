/**
 * Central data sync orchestrator
 * Manages syncing of all data from API to local database
 * Useful for hooks to keep local data in sync with server
 */

import { BadgeSyncService } from './badge.sync';
import { MilestoneSyncService } from './milestone.sync';
import { PalaceSyncService } from './palace.sync';
import { ReviewSyncService } from './review.sync';
import { UserStatsSyncService } from './userStats.sync';
import { XpConfigSyncService } from './xpConfig.sync';

export class DataSyncOrchestrator {
  /**
   * Perform a complete app-level sync
   * Syncs all critical data types from server to local database
   */
  static async performFullSync(userId: string) {
    try {
      console.log('Starting full data sync...');

      // Sync badges and milestones (these are global, not user-specific)
      await Promise.all([BadgeSyncService.syncBadges(), MilestoneSyncService.syncMilestones()]);

      // Sync user-specific data
      await Promise.all([
        BadgeSyncService.syncUserBadges(userId),
        MilestoneSyncService.syncUserMilestones(userId),
        PalaceSyncService.syncAllPalaces(),
        PalaceSyncService.syncUserPalaces(userId),
        UserStatsSyncService.syncUserStats(userId),
        ReviewSyncService.syncDueReviews(userId),
        XpConfigSyncService.syncXpConfigs(),
      ]);

      console.log('Full data sync completed successfully');
    } catch (error) {
      console.error('Full data sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync only user-specific data
   */
  static async syncUserData(userId: string) {
    try {
      console.log('Syncing user-specific data...');

      await Promise.all([
        BadgeSyncService.syncUserBadges(userId),
        MilestoneSyncService.syncUserMilestones(userId),
        PalaceSyncService.syncUserPalaces(userId),
        UserStatsSyncService.syncUserStats(userId),
        ReviewSyncService.syncDueReviews(userId),
      ]);

      console.log('User data sync completed successfully');
    } catch (error) {
      console.error('User data sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync only global reference data (badges, milestones, palaces, xp configs)
   */
  static async syncGlobalData() {
    try {
      console.log('Syncing global reference data...');

      await Promise.all([
        BadgeSyncService.syncBadges(),
        MilestoneSyncService.syncMilestones(),
        PalaceSyncService.syncAllPalaces(),
        XpConfigSyncService.syncXpConfigs(),
      ]);

      console.log('Global data sync completed successfully');
    } catch (error) {
      console.error('Global data sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync lesson-specific data
   */
  static async syncLessonData(userId: string, lessonId: string) {
    try {
      console.log(`Syncing lesson data for lesson ${lessonId}...`);

      await Promise.all([
        ReviewSyncService.syncLessonProgress(userId, lessonId),
        ReviewSyncService.syncReviewSchedule(userId, lessonId),
      ]);

      console.log('Lesson data sync completed successfully');
    } catch (error) {
      console.error('Lesson data sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync achievements (badges and milestones)
   */
  static async syncAchievements(userId: string) {
    try {
      console.log('Syncing achievements...');

      await Promise.all([
        BadgeSyncService.syncBadges(),
        BadgeSyncService.syncUserBadges(userId),
        MilestoneSyncService.syncMilestones(),
        MilestoneSyncService.syncUserMilestones(userId),
      ]);

      console.log('Achievements sync completed successfully');
    } catch (error) {
      console.error('Achievements sync failed:', error);
      throw error;
    }
  }
}
