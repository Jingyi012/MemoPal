import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { XpConfig } from '@/types/xpConfigs';
import { eq, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export function useXpConfigRepository() {
  /**
   * Get XP config for a source type
   */
  const getBySourceType = async (sourceType: string) => {
    return await db.query.xpConfigs.findFirst({
      where: (t) =>
        eq(schema.xpConfigs.sourceType, sourceType as any) && eq(schema.xpConfigs.isActive, true),
    });
  };

  /**
   * Get all active XP configs
   */
  const getAll = async () => {
    return await db.query.xpConfigs.findMany({
      where: eq(schema.xpConfigs.isActive, true),
    });
  };

  /**
   * Upsert XP configs from server
   */
  const upsertMany = async (configs: Array<XpConfig>) => {
    if (configs.length === 0) return;

    for (const cfg of configs) {
      await db
        .insert(schema.xpConfigs)
        .values({
          id: cfg.id,
          sourceType: cfg.sourceType as any,
          baseXp: cfg.baseXp,
          variableXp: cfg.variableXp,
          isActive: cfg.isActive ?? true,
        })
        .onConflictDoUpdate({
          target: schema.xpConfigs.id,
          set: {
            baseXp: cfg.baseXp,
            variableXp: cfg.variableXp,
            isActive: cfg.isActive ?? true,
          },
          where: sql`${schema.xpConfigs.updatedAt} < ${cfg.updatedAt}`,
        });
    }
  };

  return {
    getBySourceType,
    getAll,
    upsertMany,
  };
}

/**
 * Helper to record XP event
 */
export async function recordXpEvent(
  userId: string,
  sourceType:
    | 'lesson_complete'
    | 'review_complete'
    | 'word_mastered'
    | 'streak_bonus'
    | 'manual_adjustment',
  xpAmount: number,
  sourceId?: string
) {
  const id = Crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const clientEventId = `${userId}-${sourceType}-${Date.now()}`;

  await db.insert(schema.xpEvents).values({
    id,
    userId,
    sourceType,
    xpAmount,
    sourceId,
    clientEventId,
    createdAt: new Date().toISOString(),
  });

  return { id, xpAmount };
}
