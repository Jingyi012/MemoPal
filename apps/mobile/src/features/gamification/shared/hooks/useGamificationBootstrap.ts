import * as levelConfigService from '@/features/gamification/shared/services/levelConfig.service';
import * as milestoneService from '@/features/gamification/shared/services/milestone.service';
import * as systemSettingsService from '@/core/settings/services/systemSettings.service';
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
        systemSettingsService.initializeSystemSettings(),
        levelConfigService.getLevelConfigs(),
        milestoneService.getMilestones({}),
      ]);
    };

    void bootstrap();
  }, [enabled]);
}
