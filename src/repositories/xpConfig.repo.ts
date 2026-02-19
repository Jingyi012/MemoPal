import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { SourceType } from '@/enums/sourceType';
import { XpConfig } from '@/types/xpConfigs';
import { eq, lt } from 'drizzle-orm';

interface XpConfigRepository {
  getBySourceType(sourceType: SourceType): Promise<XpConfig | null | undefined>;
  getAll(): Promise<XpConfig[]>;
  upsertMany(configs: XpConfig[]): Promise<void>;
}

export function createXpConfigRepository(): XpConfigRepository {
  return {
    async getBySourceType(sourceType: SourceType): Promise<XpConfig | null | undefined> {
      return await db.query.xpConfigs.findFirst({
        where: (t) =>
          eq(schema.xpConfigs.sourceType, sourceType) && eq(schema.xpConfigs.isActive, true),
      });
    },

    async getAll(): Promise<XpConfig[]> {
      return await db.query.xpConfigs.findMany({
        where: eq(schema.xpConfigs.isActive, true),
      });
    },

    async upsertMany(configs: XpConfig[]): Promise<void> {
      if (configs.length === 0) return;
      const now = new Date().toISOString();

      for (const cfg of configs) {
        await db
          .insert(schema.xpConfigs)
          .values({
            id: cfg.id,
            sourceType: cfg.sourceType as any,
            baseXp: cfg.baseXp,
            variableXp: cfg.variableXp,
            isActive: cfg.isActive ?? true,
            updatedAt: now,
            lastSyncedAt: now,
          })
          .onConflictDoUpdate({
            target: schema.xpConfigs.id,
            set: {
              baseXp: cfg.baseXp,
              variableXp: cfg.variableXp,
              isActive: cfg.isActive ?? true,
              updatedAt: now,
              lastSyncedAt: now,
            },
            where: lt(schema.userStats.updatedAt, cfg.updatedAt),
          });
      }
    },
  };
}
