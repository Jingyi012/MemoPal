import { FeatureLimits, userStatsApi } from '@/features/gamification/shared/api/userStats';
import { systemSettingsApi } from '@/core/settings/api/systemSettings';

export const DEFAULT_FREE_LIMITS: FeatureLimits = {
  isPremium: false,
  customPalaces: 0,
  customLessonsPerPalace: 5,
  customLocationsPerPalace: 15,
  customWordsPerLesson: 25,
};

export const DEFAULT_PREMIUM_LIMITS: FeatureLimits = {
  isPremium: true,
  customPalaces: 20,
  customLessonsPerPalace: 50,
  customLocationsPerPalace: 100,
  customWordsPerLesson: 200,
};

export function getFeatureLimitsFallback(isPremium: boolean): FeatureLimits {
  return isPremium ? DEFAULT_PREMIUM_LIMITS : DEFAULT_FREE_LIMITS;
}

type TierPayload = {
  free?: number;
  premium?: number;
};

type FeatureLimitsSettingPayload = {
  customPalaces?: TierPayload;
  customLessonsPerPalace?: TierPayload;
  customLocationsPerPalace?: TierPayload;
  customWordsPerLesson?: TierPayload;
  custom_palaces?: TierPayload;
  custom_lessons_per_palace?: TierPayload;
  custom_locations_per_palace?: TierPayload;
  custom_words_per_lesson?: TierPayload;
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

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(parsed));
}

function resolveTier(
  payload: FeatureLimitsSettingPayload,
  camelKey: keyof FeatureLimitsSettingPayload,
  snakeKey: keyof FeatureLimitsSettingPayload,
  isPremium: boolean,
  fallbackValue: number
): number {
  const tier = (payload[camelKey] ?? payload[snakeKey]) as TierPayload | undefined;
  if (!tier) return fallbackValue;

  return toNonNegativeInt(isPremium ? tier.premium : tier.free, fallbackValue);
}

function parseFeatureLimitsSetting(
  rawValue: string,
  isPremium: boolean,
  fallback: FeatureLimits
): FeatureLimits | null {
  if (!rawValue) return null;

  const parsed = normalizeFeatureLimitsPayload(rawValue);
  if (!parsed) {
    return null;
  }

  return {
    isPremium,
    customPalaces: resolveTier(
      parsed,
      'customPalaces',
      'custom_palaces',
      isPremium,
      fallback.customPalaces
    ),
    customLessonsPerPalace: resolveTier(
      parsed,
      'customLessonsPerPalace',
      'custom_lessons_per_palace',
      isPremium,
      fallback.customLessonsPerPalace
    ),
    customLocationsPerPalace: resolveTier(
      parsed,
      'customLocationsPerPalace',
      'custom_locations_per_palace',
      isPremium,
      fallback.customLocationsPerPalace
    ),
    customWordsPerLesson: resolveTier(
      parsed,
      'customWordsPerLesson',
      'custom_words_per_lesson',
      isPremium,
      fallback.customWordsPerLesson
    ),
  };
}

export async function getFeatureLimits(_userId: string, isPremium: boolean): Promise<FeatureLimits> {
  const fallback = getFeatureLimitsFallback(isPremium);

  try {
    const remote = await userStatsApi.getFeatureLimits();
    return remote;
  } catch (error) {
    console.warn('Failed to fetch user feature limits endpoint:', error);
  }

  try {
    const setting = await systemSettingsApi.getFeatureLimits();
    if (setting?.value) {
      const fromSetting = parseFeatureLimitsSetting(setting.value, isPremium, fallback);
      if (fromSetting) {
        return fromSetting;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch feature limits from system settings endpoint:', error);
  }

  return fallback;
}
