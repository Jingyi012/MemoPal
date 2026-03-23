import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { SourceType } from '@/enums/sourceType';
import { XpConfig } from '@/types/xpConfigs';
import { and, eq } from 'drizzle-orm';

interface XpConfigRepository {
  getBySourceType(sourceType: SourceType): Promise<XpConfig | null | undefined>;
  getAll(): Promise<XpConfig[]>;
  upsertMany(configs: XpConfig[]): Promise<void>;
}

export function createXpConfigRepository(): XpConfigRepository {
  return {
    async getBySourceType(sourceType: SourceType): Promise<XpConfig | null | undefined> {
      return await db.query.xpConfigs.findFirst({
        where: and(eq(schema.xpConfigs.sourceType, sourceType), eq(schema.xpConfigs.isActive, true)),
      });
    },

    async getAll(): Promise<XpConfig[]> {
      return await db.query.xpConfigs.findMany({
        where: eq(schema.xpConfigs.isActive, true),
      });
    },

    async upsertMany(configs: XpConfig[]): Promise<void> {
      if (configs.length === 0) return;

      for (const cfg of configs) {
        const createdAt = cfg.createdAt || new Date().toISOString();
        const updatedAt = cfg.updatedAt || new Date().toISOString();

        await db
          .insert(schema.xpConfigs)
          .values({
            id: cfg.id,
            sourceType: cfg.sourceType as any,
            baseXp: cfg.baseXp,
            variableXp: cfg.variableXp,
            isActive: cfg.isActive ?? true,
            createdAt,
            updatedAt,
            lastSyncedAt: updatedAt,
          })
          .onConflictDoUpdate({
            target: schema.xpConfigs.id,
            set: {
              baseXp: cfg.baseXp,
              variableXp: cfg.variableXp,
              isActive: cfg.isActive ?? true,
              updatedAt,
              lastSyncedAt: updatedAt,
            }
          });
      }
    },
  };
}
