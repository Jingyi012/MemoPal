import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { asc, eq, gt, gte } from 'drizzle-orm';

interface LevelConfigRepository {
  getAll(): Promise<any[]>;
  getByLevel(level: number): Promise<any | null>;
  getLevelByXp(totalXp: number): Promise<number>;
  getNextLevel(currentLevel: number): Promise<any | null>;
  getXpRequiredForLevel(level: number): Promise<number>;
  replaceAll(configs: any[]): Promise<void>;
  upsertMany(configs: any[]): Promise<void>;
}

export function createLevelConfigRepository(): LevelConfigRepository {
  return {
    async getAll(): Promise<any[]> {
      return await db.query.levelConfigs.findMany({
        orderBy: [asc(schema.levelConfigs.level)],
      });
    },

    async getByLevel(level: number): Promise<any | null> {
      return await db.query.levelConfigs.findFirst({
        where: eq(schema.levelConfigs.level, level),
      });
    },

    async getLevelByXp(totalXp: number): Promise<number> {
      const configs = await db.query.levelConfigs.findMany({
        where: gte(schema.levelConfigs.requiredXp, 0),
        orderBy: [asc(schema.levelConfigs.level)],
      });

      let currentLevel = 1;
      for (const config of configs) {
        if (config.requiredXp <= totalXp) {
          currentLevel = config.level;
        } else {
          break;
        }
      }

      return currentLevel;
    },

    async getNextLevel(currentLevel: number): Promise<any | null> {
      return await db.query.levelConfigs.findFirst({
        where: gt(schema.levelConfigs.level, currentLevel),
        orderBy: [asc(schema.levelConfigs.level)],
      });
    },

    async getXpRequiredForLevel(level: number): Promise<number> {
      const config = await this.getByLevel(level);
      return config?.requiredXp ?? 0;
    },

    async replaceAll(configs: any[]): Promise<void> {
      const now = new Date().toISOString();
      const normalized = configs.map((cfg) => ({
        ...cfg,
        createdAt: cfg.createdAt ?? now,
        updatedAt: cfg.updatedAt ?? now,
        isDeleted: Boolean(cfg.isDeleted),
        deletedAt: cfg.deletedAt ?? null,
        lastSyncedAt: now,
      }));

      await db.transaction(async (tx) => {
        await tx.delete(schema.levelConfigs);
        if (normalized.length > 0) {
          await tx.insert(schema.levelConfigs).values(normalized);
        }
      });
    },

    async upsertMany(configs: any[]): Promise<void> {
      if (configs.length === 0) return;
      const now = new Date().toISOString();

      for (const cfg of configs) {
        await db
          .insert(schema.levelConfigs)
          .values({
            ...cfg,
            updatedAt: now,
            lastSyncedAt: now,
          })
          .onConflictDoUpdate({
            target: schema.levelConfigs.level,
            set: {
              requiredXp: cfg.requiredXp,
              title: cfg.title,
              updatedAt: now,
              lastSyncedAt: now,
            },
          });
      }
    },
  };
}
