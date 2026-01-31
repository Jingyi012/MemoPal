/**
 * Local sync service for XP configurations
 * Syncs XP configuration data from API to local database
 */

import { XpConfigService } from '../xpConfig.service';

export class XpConfigSyncService {
  /**
   * Sync all XP configurations from API to local storage
   */
  static async syncXpConfigs() {
    try {
      const configs = await XpConfigService.getXpConfigs();

      if (configs && configs.length > 0) {
        // Note: XpConfigRepository doesn't have upsertMany, so we'll need to add it
        // For now, we'll store in local database manually or create a local store
        return configs;
      }
    } catch (error) {
      console.error('Failed to sync XP configs:', error);
      throw error;
    }
  }

  /**
   * Get XP config for a specific source type
   */
  static async syncXpConfigBySourceType(sourceType: string) {
    try {
      const config = await XpConfigService.getXpConfigBySourceType(sourceType);
      return config;
    } catch (error) {
      console.error('Failed to sync XP config for source type:', error);
      throw error;
    }
  }
}
