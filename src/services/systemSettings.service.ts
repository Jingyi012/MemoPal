import { systemSettingsApi } from '@/api/systemSettings';
import { SYSTEM_SETTING_KEYS } from '@/constants/systemSettingKeys';
import { createSystemSettingsRepository } from '@/repositories/systemSettings.repo';
import { GamificationMobileUiConfig } from '@/types/gamificationUiConfig';
import { HelpFaqConfig } from '@/types/helpFaqConfig';
import { PrivacyPolicyConfig } from '@/types/privacyPolicyConfig';
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

type FeatureLimitsTier = {
  free?: number;
  premium?: number;
};

type FeatureLimitsSettingPayload = {
  customPalaces?: FeatureLimitsTier;
  customLessonsPerPalace?: FeatureLimitsTier;
  customLocationsPerPalace?: FeatureLimitsTier;
  customWordsPerLesson?: FeatureLimitsTier;
  custom_palaces?: FeatureLimitsTier;
  custom_lessons_per_palace?: FeatureLimitsTier;
  custom_locations_per_palace?: FeatureLimitsTier;
  custom_words_per_lesson?: FeatureLimitsTier;
};

function normalizeFeatureLimitsPayload(value: unknown): FeatureLimitsSettingPayload | null {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      return normalizeFeatureLimitsPayload(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (typeof value !== 'object') return null;
  return value as FeatureLimitsSettingPayload;
}

function toNonNegativeInt(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.trunc(parsed));
}

function resolveTier(
  payload: FeatureLimitsSettingPayload,
  camelKey: keyof FeatureLimitsSettingPayload,
  snakeKey: keyof FeatureLimitsSettingPayload,
  fallback: { free: number; premium: number }
) {
  const tier = (payload[camelKey] ?? payload[snakeKey]) as FeatureLimitsTier | undefined;
  if (!tier) return fallback;

  return {
    free: toNonNegativeInt(tier.free, fallback.free),
    premium: toNonNegativeInt(tier.premium, fallback.premium),
  };
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
    const remote = await systemSettingsApi.getFeatureLimits();
    if (remote) {
      await repo.syncSetting(remote);
    }
  } catch (error) {
    console.warn('[SystemSettings] Failed to sync feature limits from backend:', error);
  }

  try {
    const rawPayload = await repo.getJson<FeatureLimitsSettingPayload | string>(
      SYSTEM_SETTING_KEYS.FEATURE_LIMITS
    );
    const payload = normalizeFeatureLimitsPayload(rawPayload);
    if (!payload) {
      console.warn('[SystemSettings] No feature limits found in cache');
      return getSilentFallbackLimits(isPremium);
    }

    const fallback = getSilentFallbackLimits(isPremium);
    const customPalaces = resolveTier(
      payload,
      'customPalaces',
      'custom_palaces',
      fallback.customPalaces
    );
    const customLessonsPerPalace = resolveTier(
      payload,
      'customLessonsPerPalace',
      'custom_lessons_per_palace',
      fallback.customLessonsPerPalace
    );
    const customLocationsPerPalace = resolveTier(
      payload,
      'customLocationsPerPalace',
      'custom_locations_per_palace',
      fallback.customLocationsPerPalace
    );
    const customWordsPerLesson = resolveTier(
      payload,
      'customWordsPerLesson',
      'custom_words_per_lesson',
      fallback.customWordsPerLesson
    );

    return {
      isPremium,
      customPalaces,
      customLessonsPerPalace,
      customLocationsPerPalace,
      customWordsPerLesson,
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
      await repo.upsert(SYSTEM_SETTING_KEYS.GAMIFICATION_MOBILE_UI_CONFIG, JSON.stringify(remote));
    }
  } catch (error) {
    console.warn('[SystemSettings] Failed to sync gamification UI config from backend:', error);
  }

  return await repo.getJson<Partial<GamificationMobileUiConfig>>(
    SYSTEM_SETTING_KEYS.GAMIFICATION_MOBILE_UI_CONFIG
  );
}
/**
 * Get help/FAQ raw config from system settings.
 * Fallback and normalization are handled in the consuming hook.
 */
export async function getHelpFaqConfig(): Promise<Partial<HelpFaqConfig> | null> {
  try {
    const remote = await systemSettingsApi.getHelpFaqConfig();
    if (isSystemSettingDto(remote)) {
      await repo.syncSetting(remote);
    } else if (remote) {
      await repo.upsert(SYSTEM_SETTING_KEYS.SUPPORT_HELP_FAQ, JSON.stringify(remote));
    }
  } catch (error) {
    console.warn('[SystemSettings] Failed to sync help/faq config from backend:', error);
  }

  return await repo.getJson<Partial<HelpFaqConfig>>(SYSTEM_SETTING_KEYS.SUPPORT_HELP_FAQ);
}

/**
 * Get privacy policy raw config from system settings.
 * Fallback and normalization are handled in the consuming hook.
 */
export async function getPrivacyPolicyConfig(): Promise<Partial<PrivacyPolicyConfig> | null> {
  try {
    const remote = await systemSettingsApi.getPrivacyPolicyConfig();
    if (isSystemSettingDto(remote)) {
      await repo.syncSetting(remote);
    } else if (remote) {
      await repo.upsert(SYSTEM_SETTING_KEYS.SUPPORT_PRIVACY_POLICY, JSON.stringify(remote));
    }
  } catch (error) {
    console.warn('[SystemSettings] Failed to sync privacy policy config from backend:', error);
  }

  return await repo.getJson<Partial<PrivacyPolicyConfig>>(
    SYSTEM_SETTING_KEYS.SUPPORT_PRIVACY_POLICY
  );
}

// === Fallback Defaults ===

function getSilentFallbackLimits(isPremium: boolean = false) {
  return {
    isPremium,
    customPalaces: { free: 0, premium: 20 },
    customLessonsPerPalace: { free: 5, premium: 50 },
    customLocationsPerPalace: { free: 15, premium: 100 },
    customWordsPerLesson: { free: 25, premium: 200 },
  };
}
