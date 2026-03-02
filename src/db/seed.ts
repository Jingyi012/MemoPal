import { MOCK_USER } from '@/constants/auth';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { buildLessonBundles, buildLocations } from '@/db/seeding/builders';
import { PALACES } from '@/db/seeding/catalog';
import { BADGES, LEVEL_CONFIGS, MILESTONES, XP_CONFIGS } from '@/db/seeding/gamification';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEED_VERSION = 'offline-v3-palace-5x10x3-lessons';
const SEED_VERSION_KEY = '@memopal_seed_version';

async function clearAllSeededTables(tx: any) {
  await tx.delete(schema.syncQueue);
  await tx.delete(schema.reviewSchedules);
  await tx.delete(schema.lessonProgress);
  await tx.delete(schema.words);
  await tx.delete(schema.lessons);
  await tx.delete(schema.locations);
  await tx.delete(schema.palaces);
  await tx.delete(schema.badges);
  await tx.delete(schema.milestones);
  await tx.delete(schema.xpEvents);
  await tx.delete(schema.xpConfigs);
  await tx.delete(schema.levelConfigs);
  await tx.delete(schema.userStats);
  await tx.delete(schema.users);
}

export async function resetSeedData() {
  await db.transaction(async (tx) => {
    await clearAllSeededTables(tx);
  });
  await AsyncStorage.removeItem(SEED_VERSION_KEY);
}

export async function seedInitialData(forceReset = false) {
  const appliedSeedVersion = await AsyncStorage.getItem(SEED_VERSION_KEY);
  const shouldReset = forceReset || appliedSeedVersion !== SEED_VERSION;

  await db.transaction(async (tx) => {
    if (shouldReset) {
      await clearAllSeededTables(tx);
    } else {
      const existingConfig = await tx.query.levelConfigs.findFirst();
      if (existingConfig) return;
    }

    const now = new Date().toISOString();

    for (const lvl of LEVEL_CONFIGS) {
      await tx.insert(schema.levelConfigs).values({ ...lvl, createdAt: now, updatedAt: now }).onConflictDoNothing();
    }

    for (const xp of XP_CONFIGS) {
      await tx.insert(schema.xpConfigs).values({ ...xp, createdAt: now, updatedAt: now }).onConflictDoNothing();
    }

    await tx.insert(schema.users).values({
      id: MOCK_USER.id,
      displayName: MOCK_USER.displayName,
      avatarUrl: MOCK_USER.avatarUrl ?? null,
      email: MOCK_USER.email ?? 'player@example.com',
      totalXp: 0,
      level: 1,
      isPremium: false,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();

    await tx.insert(schema.userStats).values({
      userId: MOCK_USER.id,
      lessonsCompleted: 0,
      wordsLearned: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: now,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();

    for (const palace of PALACES) {
      await tx.insert(schema.palaces).values({
        id: palace.id,
        name: palace.name,
        description: palace.description,
        locationsCount: 10,
        thumbnail: palace.thumbnail,
        isLocked: palace.isLocked,
        unlockedAt: palace.isLocked ? null : now,
        requiredXp: palace.requiredXp,
        isPremium: false,
        isCustom: false,
        createdBy: null,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      }).onConflictDoNothing();

      const locations = buildLocations(palace);
      for (const location of locations) {
        await tx.insert(schema.locations).values({ ...location, createdAt: now, updatedAt: now }).onConflictDoNothing();
      }

      const lessonBundles = buildLessonBundles(palace);
      for (const bundle of lessonBundles) {
        await tx.insert(schema.lessons).values({ ...bundle.lesson, createdAt: now, updatedAt: now }).onConflictDoNothing();
        for (const word of bundle.words) {
          await tx.insert(schema.words).values({ ...word, createdAt: now, updatedAt: now }).onConflictDoNothing();
        }
      }
    }

    for (const badge of BADGES) {
      await tx.insert(schema.badges).values({ ...badge, earnedAt: null, createdAt: now, updatedAt: now }).onConflictDoNothing();
    }

    for (const milestone of MILESTONES) {
      await tx.insert(schema.milestones).values({ ...milestone, achievedAt: null, createdAt: now, updatedAt: now }).onConflictDoNothing();
    }
  });

  await AsyncStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
}
