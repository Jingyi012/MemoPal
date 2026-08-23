import { systemSettingsApi } from '@/core/settings/api/systemSettings';
import type { SystemSettingDto } from '@/core/settings/types/systemSettings';
import type { GamificationMobileUiConfig } from '@/features/gamification/shared/types/gamificationUiConfig';
import type { PrivacyPolicyConfig } from '@/features/profile/types/privacyPolicyConfig';
import type { HelpFaqConfig } from '@/features/support/types/helpFaqConfig';

type FeatureLimitsTier = { free?: number; premium?: number };
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

function parseJson<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value as T;
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'string' ? parseJson<T>(parsed) : (parsed as T);
  } catch {
    return null;
  }
}

function settingPayload<T>(value: SystemSettingDto | T | null): T | null {
  if (!value) return null;
  if (typeof value === 'object' && 'value' in value) {
    return parseJson<T>((value as SystemSettingDto).value);
  }
  return value as T;
}

function toNonNegativeInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
}

function resolveTier(
  payload: FeatureLimitsSettingPayload,
  camelKey: keyof FeatureLimitsSettingPayload,
  snakeKey: keyof FeatureLimitsSettingPayload,
  fallback: { free: number; premium: number }
) {
  const tier = (payload[camelKey] ?? payload[snakeKey]) as FeatureLimitsTier | undefined;
  return {
    free: toNonNegativeInt(tier?.free, fallback.free),
    premium: toNonNegativeInt(tier?.premium, fallback.premium),
  };
}

export async function initializeSystemSettings(): Promise<void> {
  await systemSettingsApi.fetchAllSettings();
}

export async function refreshSettingsGroup(_pattern: string): Promise<void> {
  await systemSettingsApi.fetchAllSettings();
}

export async function getFeatureLimits(isPremium = false) {
  const fallback = getSilentFallbackLimits(isPremium);
  const setting = await systemSettingsApi.getFeatureLimits();
  const payload = settingPayload<FeatureLimitsSettingPayload>(setting);
  if (!payload) return fallback;

  return {
    isPremium,
    customPalaces: resolveTier(payload, 'customPalaces', 'custom_palaces', fallback.customPalaces),
    customLessonsPerPalace: resolveTier(
      payload,
      'customLessonsPerPalace',
      'custom_lessons_per_palace',
      fallback.customLessonsPerPalace
    ),
    customLocationsPerPalace: resolveTier(
      payload,
      'customLocationsPerPalace',
      'custom_locations_per_palace',
      fallback.customLocationsPerPalace
    ),
    customWordsPerLesson: resolveTier(
      payload,
      'customWordsPerLesson',
      'custom_words_per_lesson',
      fallback.customWordsPerLesson
    ),
  };
}

export async function getGamificationUiConfig(): Promise<Partial<GamificationMobileUiConfig> | null> {
  return settingPayload<Partial<GamificationMobileUiConfig>>(
    await systemSettingsApi.getGamificationMobileUiConfig()
  );
}

export async function getHelpFaqConfig(): Promise<Partial<HelpFaqConfig> | null> {
  return settingPayload<Partial<HelpFaqConfig>>(await systemSettingsApi.getHelpFaqConfig());
}

export async function getPrivacyPolicyConfig(): Promise<Partial<PrivacyPolicyConfig> | null> {
  return settingPayload<Partial<PrivacyPolicyConfig>>(
    await systemSettingsApi.getPrivacyPolicyConfig()
  );
}

function getSilentFallbackLimits(isPremium = false) {
  return {
    isPremium,
    customPalaces: { free: 0, premium: 20 },
    customLessonsPerPalace: { free: 5, premium: 50 },
    customLocationsPerPalace: { free: 15, premium: 100 },
    customWordsPerLesson: { free: 25, premium: 200 },
  };
}
