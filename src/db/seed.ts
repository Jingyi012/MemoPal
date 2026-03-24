import { db } from '@/db/client';
import * as schema from '@/db/schema';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEED_VERSION_KEY = '@memopal_seed_version';

async function clearAllLocalTables(tx: any) {
  await tx.delete(schema.syncQueue);
  await tx.delete(schema.reviewSchedules);
  await tx.delete(schema.lessonProgress);
  await tx.delete(schema.words);
  await tx.delete(schema.lessons);
  await tx.delete(schema.locations);
  await tx.delete(schema.palaces);
  await tx.delete(schema.missions);
  await tx.delete(schema.missionUiConfigs);
  await tx.delete(schema.badges);
  await tx.delete(schema.milestones);
  await tx.delete(schema.featureLimits);
  await tx.delete(schema.xpEvents);
  await tx.delete(schema.xpConfigs);
  await tx.delete(schema.levelConfigs);
  await tx.delete(schema.userStats);
  await tx.delete(schema.users);
}

export async function resetSeedData() {
  await db.transaction(async (tx) => {
    await clearAllLocalTables(tx);
  });

  await AsyncStorage.removeItem(SEED_VERSION_KEY);
}
