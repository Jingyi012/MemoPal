/**
 * Local sync service for palaces
 * Syncs palace data from API to local database
 */

import { usePalaceRepository } from '@/repositories/palace.repo';
import { PalaceService } from '../palace.service';

export class PalaceSyncService {
  /**
   * Sync all available palaces from API to local storage
   */
  static async syncAllPalaces() {
    try {
      const response = await PalaceService.getPagedPalaces({
        pageNumber: 1,
        pageSize: 1000,
      });

      if (response.data && response.data.length > 0) {
        const repo = usePalaceRepository();
        await repo.upsertMany(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to sync palaces:', error);
      throw error;
    }
  }

  /**
   * Sync user's unlocked palaces from API to local storage
   */
  static async syncUserPalaces(userId: string) {
    try {
      const response = await PalaceService.getUserPalaces(userId);

      if (response.data && response.data.length > 0) {
        const repo = usePalaceRepository();
        // Update the local palaces with user unlock status
        for (const palace of response.data) {
          await repo.unlockPalaceForUser(userId, palace.id);
        }
        return response.data;
      }
    } catch (error) {
      console.error('Failed to sync user palaces:', error);
      throw error;
    }
  }
}
