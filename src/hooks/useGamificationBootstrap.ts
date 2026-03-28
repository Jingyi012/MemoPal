import * as badgeService from '@/services/badge.service';
import * as levelConfigService from '@/services/levelConfig.service';
import * as milestoneService from '@/services/milestone.service';
import * as systemSettingsService from '@/services/systemSettings.service';
import * as xpConfigService from '@/services/xpConfig.service';
import { useEffect } from 'react';

/**
 * Preload gamification data from backend so the app can apply latest admin configs quickly.
 * Runs once after app bootstrap and keeps offline fallback behavior from each service.
 */
export function useGamificationBootstrap(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const bootstrap = async () => {
      await Promise.allSettled([
        xpConfigService.getXpConfigs(),
        levelConfigService.getLevelConfigs(),
        badgeService.getAllBadges(),
        milestoneService.getMilestones({}),
        systemSettingsService.getGamificationUiConfig(),
      ]);
    };

    void bootstrap();
  }, [enabled]);
}
