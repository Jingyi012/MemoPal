import { systemSettingsApi } from '@/api/systemSettings';
import { SYSTEM_SETTING_KEYS } from '@/constants/systemSettingKeys';
import { createSystemSettingsRepository } from '@/repositories/systemSettings.repo';
import { GamificationMobileUiConfig } from '@/types/gamificationUiConfig';
import { SystemSettingDto } from '@/types/systemSettings';

const repo = createSystemSettingsRepository();

function isSystemSettingDto(value: unknown): value is SystemSettingDto {
  if (!value || typeof value !== 'object') return false;

  const setting = value as Partial<SystemSettingDto>;
  return (
    typeof setting.key === 'string' &&
    setting.key.length > 0 &&
    typeof setting.value === 'string' &&
    typeof setting.updatedAt === 'string'
  );
}

/**
 * Initialize system settings cache on app startup
 * Called during app initialization or login
 */
export async function initializeSystemSettings(): Promise<void> {
  try {
    console.log('[SystemSettings] Initializing system settings cache...');

    // Fetch all settings from backend in one call
    const settings = await systemSettingsApi.fetchAllSettings();

    if (!settings || settings.length === 0) {
      console.warn('[SystemSettings] No settings received from backend');
      return;
    }

    // Store all settings in local database
    await repo.upsertMany(
      settings.map((s) => ({
        key: s.key,
        value: s.value,
        description: s.description,
      }))
    );

    console.log(`[SystemSettings] Successfully cached ${settings.length} system settings`);
  } catch (error) {
    console.error('[SystemSettings] Failed to initialize system settings:', error);
    // Don't throw - allow app to continue with defaults
  }
}

/**
 * Refresh specific settings group from backend
 * Call this when you need fresh data for a specific setting category
 */
export async function refreshSettingsGroup(pattern: string): Promise<void> {
  try {
    console.log(`[SystemSettings] Refreshing settings matching: ${pattern}`);

    const settings = await systemSettingsApi.fetchAllSettings();

    if (!settings || settings.length === 0) return;

    // Filter to pattern and update
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    const filtered = settings.filter((s) => regex.test(s.key));

    if (filtered.length > 0) {
      await repo.upsertMany(
        filtered.map((s) => ({
          key: s.key,
          value: s.value,
          description: s.description,
        }))
      );

      console.log(`[SystemSettings] Refreshed ${filtered.length} settings for pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`[SystemSettings] Failed to refresh settings group ${pattern}:`, error);
  }
}

/**
 * Get feature limits with tier selection
 */
export async function getFeatureLimits(isPremium: boolean = false) {
  try {
    // Get all limits
    const allSettings = await repo.getByPattern('limits.*');

    if (allSettings.length === 0) {
      console.warn('[SystemSettings] No feature limits found in cache');
      return getSilentFallbackLimits();
    }

    // Parse and organize by category and tier
    const limits: Record<string, { free: number; premium: number }> = {};

    for (const setting of allSettings) {
      const match = setting.key.match(/^limits\.(.+)\.(free|premium)$/);
      if (!match) continue;

      const [, category, tier] = match;
      if (!limits[category]) {
        limits[category] = { free: 0, premium: 0 };
      }

      try {
        limits[category][tier as 'free' | 'premium'] = parseInt(setting.value, 10) || 0;
      } catch {
        console.warn(`[SystemSettings] Failed to parse limit ${setting.key}: ${setting.value}`);
      }
    }

    return {
      isPremium,
      customPalaces: limits['custom_palaces'] || { free: 0, premium: 20 },
      customLessonsPerPalace: limits['custom_lessons_per_palace'] || { free: 5, premium: 50 },
      customLocationsPerPalace: limits['custom_locations_per_palace'] || { free: 15, premium: 100 },
      customWordsPerLesson: limits['custom_words_per_lesson'] || { free: 25, premium: 200 },
    };
  } catch (error) {
    console.error('[SystemSettings] Error getting feature limits:', error);
    return getSilentFallbackLimits(isPremium);
  }
}

/**
 * Get gamification UI config
 */
export async function getGamificationUiConfig(): Promise<Partial<GamificationMobileUiConfig> | null> {
  try {
    const remote = (await systemSettingsApi.getGamificationMobileUiConfig()) as unknown;

    if (isSystemSettingDto(remote)) {
      await repo.syncSetting(remote);
    } else if (remote) {
      // Backward-compat fallback: some backend versions may return raw config payload.
      await repo.upsert(
        SYSTEM_SETTING_KEYS.GAMIFICATION_MOBILE_UI_CONFIG,
        JSON.stringify(remote)
      );
    }
  } catch (error) {
    console.warn('[SystemSettings] Failed to sync gamification UI config from backend:', error);
  }

  return await repo.getJson<Partial<GamificationMobileUiConfig>>(
    SYSTEM_SETTING_KEYS.GAMIFICATION_MOBILE_UI_CONFIG
  );
}

// === Fallback Defaults ===

function getSilentFallbackLimits(isPremium: boolean = false) {
  return {
    isPremium,
    customPalaces: { free: 0, premium: 20 },
    customLessonsPerPalace: { free: 5, premium: 10 },
    customLocationsPerPalace: { free: 10, premium: 100 },
    customWordsPerLesson: { free: 10, premium: 100 },
  };
}
