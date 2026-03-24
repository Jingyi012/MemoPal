import { FeatureLimits } from '@/api/userStats';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { and, eq } from 'drizzle-orm';

interface FeatureLimitsRepository {
  getByUserId(userId: string): Promise<FeatureLimits | null>;
  upsert(userId: string, limits: FeatureLimits): Promise<void>;
}

export function createFeatureLimitsRepository(): FeatureLimitsRepository {
  return {
    async getByUserId(userId: string): Promise<FeatureLimits | null> {
      const row = await db.query.featureLimits.findFirst({
        where: and(eq(schema.featureLimits.userId, userId), eq(schema.featureLimits.isDeleted, false)),
      });

      if (!row) {
        return null;
      }

      return {
        isPremium: row.isPremium,
        customPalaces: row.customPalaces,
        customLessonsPerPalace: row.customLessonsPerPalace,
        customLocationsPerPalace: row.customLocationsPerPalace,
        customWordsPerLesson: row.customWordsPerLesson,
      };
    },

    async upsert(userId: string, limits: FeatureLimits): Promise<void> {
      const now = new Date().toISOString();

      await db
        .insert(schema.featureLimits)
        .values({
          userId,
          isPremium: limits.isPremium,
          customPalaces: limits.customPalaces,
          customLessonsPerPalace: limits.customLessonsPerPalace,
          customLocationsPerPalace: limits.customLocationsPerPalace,
          customWordsPerLesson: limits.customWordsPerLesson,
          updatedAt: now,
          lastSyncedAt: now,
          isDeleted: false,
          deletedAt: null,
        })
        .onConflictDoUpdate({
          target: schema.featureLimits.userId,
          set: {
            isPremium: limits.isPremium,
            customPalaces: limits.customPalaces,
            customLessonsPerPalace: limits.customLessonsPerPalace,
            customLocationsPerPalace: limits.customLocationsPerPalace,
            customWordsPerLesson: limits.customWordsPerLesson,
            updatedAt: now,
            lastSyncedAt: now,
            isDeleted: false,
            deletedAt: null,
          },
        });
    },
  };
}

