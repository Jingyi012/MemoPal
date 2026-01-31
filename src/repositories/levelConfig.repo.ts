import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { asc, eq, gte } from 'drizzle-orm';

export function useLevelConfigRepository() {
  /**
   * Get all level configurations
   */
  const getAll = async () => {
    return await db.query.levelConfigs.findMany({
      orderBy: [asc(schema.levelConfigs.level)],
    });
  };

  /**
   * Get level config by level number
   */
  const getByLevel = async (level: number) => {
    return await db.query.levelConfigs.findFirst({
      where: eq(schema.levelConfigs.level, level),
    });
  };

  /**
   * Get the level for a given XP amount
   * Returns the highest level that the XP can achieve
   */
  const getLevelByXp = async (totalXp: number) => {
    const configs = await db.query.levelConfigs.findMany({
      where: gte(schema.levelConfigs.requiredXp, 0),
      orderBy: [asc(schema.levelConfigs.level)],
    });

    // Find the highest level where requiredXp <= totalXp
    let currentLevel = 1;
    for (const config of configs) {
      if (config.requiredXp <= totalXp) {
        currentLevel = config.level;
      } else {
        break;
      }
    }

    return currentLevel;
  };

  /**
   * Get the next level config after current level
   */
  const getNextLevel = async (currentLevel: number) => {
    return await db.query.levelConfigs.findFirst({
      where: (t) => {
        const { gt } = require('drizzle-orm');
        return gt(schema.levelConfigs.level, currentLevel);
      },
      orderBy: [asc(schema.levelConfigs.level)],
    });
  };

  /**
   * Get XP required for a specific level
   */
  const getXpRequiredForLevel = async (level: number) => {
    const config = await getByLevel(level);
    return config?.requiredXp ?? 0;
  };

  return {
    getAll,
    getByLevel,
    getLevelByXp,
    getNextLevel,
    getXpRequiredForLevel,
  };
}
