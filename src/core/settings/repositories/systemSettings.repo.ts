import { SYSTEM_SETTING_KEYS } from '@/core/settings/constants/systemSettingKeys';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { LevelConfigs } from '@/features/gamification/shared/types/levelConfigs';
import { SystemSettingDto } from '@/core/settings/types/systemSettings';
import { XpConfig } from '@/features/gamification/shared/types/xpConfigs';
import { eq } from 'drizzle-orm';

export interface SystemSetting {
  key: string;
  value: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

function parseArrayPayload(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      if (Array.isArray(record.configs)) return record.configs;
      if (Array.isArray(record.levels)) return record.levels;
      if (Array.isArray(record.items)) return record.items;
    }
  } catch {
    // no-op: caller will fall back to []
  }

  return [];
}

export function createSystemSettingsRepository() {
  return {
    async get(key: string): Promise<SystemSetting | null> {
      const result = await db.query.systemSettings.findFirst({
        where: eq(schema.systemSettings.key, key),
      });
      return result ?? null;
    },

    async getAll(): Promise<SystemSetting[]> {
      return await db.query.systemSettings.findMany();
    },

    async getByPattern(pattern: string): Promise<SystemSetting[]> {
      const allSettings = await db.query.systemSettings.findMany();
      const regex = new RegExp(`^${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
      return allSettings.filter((s) => regex.test(s.key));
    },

    async upsert(key: string, value: string, description?: string): Promise<void> {
      const now = new Date().toISOString();
      const existing = await this.get(key);

      if (existing) {
        await db
          .update(schema.systemSettings)
          .set({
            value,
            description,
            updatedAt: now,
            isDeleted: false,
            deletedAt: null,
          })
          .where(eq(schema.systemSettings.key, key));
        return;
      }

      await db.insert(schema.systemSettings).values({
        key,
        value,
        description,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: null,
        isDeleted: false,
        deletedAt: null,
      });
    },

    async upsertWithTimestamp(
      key: string,
      value: string,
      serverUpdatedAt: string,
      description?: string
    ): Promise<void> {
      const existing = await this.get(key);
      if (!existing) {
        await db.insert(schema.systemSettings).values({
          key,
          value,
          description,
          createdAt: serverUpdatedAt,
          updatedAt: serverUpdatedAt,
          lastSyncedAt: serverUpdatedAt,
          isDeleted: false,
          deletedAt: null,
        });
        return;
      }

      const serverTime = new Date(serverUpdatedAt).getTime();
      const localTime = new Date(existing.updatedAt).getTime();
      if (Number.isFinite(serverTime) && serverTime > localTime) {
        await db
          .update(schema.systemSettings)
          .set({
            value,
            description,
            updatedAt: serverUpdatedAt,
            lastSyncedAt: serverUpdatedAt,
            isDeleted: false,
            deletedAt: null,
          })
          .where(eq(schema.systemSettings.key, key));
      }
    },

    async upsertMany(
      settings: { key: string; value: string; description?: string }[]
    ): Promise<void> {
      for (const setting of settings) {
        await this.upsert(setting.key, setting.value, setting.description);
      }
    },

    async upsertManyWithTimestamp(settings: SystemSettingDto[]): Promise<void> {
      await this.syncSettings(settings);
    },

    async syncSetting(setting: SystemSettingDto): Promise<void> {
      await this.upsertWithTimestamp(
        setting.key,
        setting.value,
        setting.updatedAt,
        setting.description
      );
    },

    async syncSettings(settings: SystemSettingDto[]): Promise<void> {
      for (const setting of settings) {
        await this.syncSetting(setting);
      }
    },

    async getJson<T = unknown>(key: string): Promise<T | null> {
      const setting = await this.get(key);
      if (!setting?.value) return null;
      try {
        return JSON.parse(setting.value) as T;
      } catch {
        return null;
      }
    },

    async getXpConfigs(): Promise<XpConfig[]> {
      const setting = await this.get(SYSTEM_SETTING_KEYS.XP_CONFIGS);
      if (!setting?.value) return [];

      const items = parseArrayPayload(setting.value);
      return items
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((item) => ({
          id: String(item.id ?? item.key ?? item.sourceType ?? ''),
          sourceType: String(item.sourceType ?? '') as XpConfig['sourceType'],
          baseXp: Number(item.baseXp ?? 0),
          variableXp: Number(item.variableXp ?? 0),
          isActive: Boolean(item.isActive ?? true),
          createdAt: String(item.createdAt ?? setting.createdAt),
          updatedAt: String(item.updatedAt ?? setting.updatedAt),
        }))
        .filter((item) => item.id.length > 0 && item.sourceType.length > 0);
    },

    async getLevelConfigs(): Promise<LevelConfigs[]> {
      const setting = await this.get(SYSTEM_SETTING_KEYS.LEVEL_CONFIGS);
      if (!setting?.value) return [];

      const items = parseArrayPayload(setting.value);
      return items
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((item) => ({
          level: Number(item.level ?? 0),
          requiredXp: Number(item.requiredXp ?? 0),
          title: item.title ? String(item.title) : undefined,
          createdAt: item.createdAt ? String(item.createdAt) : setting.createdAt,
          updatedAt: item.updatedAt ? String(item.updatedAt) : setting.updatedAt,
        }))
        .filter((item) => item.level > 0)
        .sort((a, b) => a.level - b.level);
    },

    async getFeatureLimits(): Promise<Record<string, { free: number; premium: number }>> {
      const setting = await this.get(SYSTEM_SETTING_KEYS.FEATURE_LIMITS);
      if (!setting?.value) return {};

      try {
        const initial = JSON.parse(setting.value) as unknown;
        const parsed =
          typeof initial === 'string'
            ? (JSON.parse(initial) as Record<string, { free?: number; premium?: number }>)
            : (initial as Record<string, { free?: number; premium?: number }>);

        const toValue = (value: unknown) =>
          Number.isFinite(Number(value)) ? Math.max(0, Math.trunc(Number(value))) : 0;

        return {
          customPalaces: {
            free: toValue(parsed.customPalaces?.free ?? parsed.custom_palaces?.free),
            premium: toValue(parsed.customPalaces?.premium ?? parsed.custom_palaces?.premium),
          },
          customLessonsPerPalace: {
            free: toValue(
              parsed.customLessonsPerPalace?.free ?? parsed.custom_lessons_per_palace?.free
            ),
            premium: toValue(
              parsed.customLessonsPerPalace?.premium ?? parsed.custom_lessons_per_palace?.premium
            ),
          },
          customLocationsPerPalace: {
            free: toValue(
              parsed.customLocationsPerPalace?.free ?? parsed.custom_locations_per_palace?.free
            ),
            premium: toValue(
              parsed.customLocationsPerPalace?.premium ??
                parsed.custom_locations_per_palace?.premium
            ),
          },
          customWordsPerLesson: {
            free: toValue(parsed.customWordsPerLesson?.free ?? parsed.custom_words_per_lesson?.free),
            premium: toValue(
              parsed.customWordsPerLesson?.premium ?? parsed.custom_words_per_lesson?.premium
            ),
          },
        };
      } catch {
        return {};
      }
    },
  };
}
