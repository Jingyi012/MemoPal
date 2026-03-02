import { MOCK_USER } from '@/constants/auth';
import { db } from '@/db/client';
import { mockLessons } from '@/db/mock/lesson.mock';
import { mockLocations } from '@/db/mock/location.mock';
import { mockPalaces } from '@/db/mock/palace.mock';
import { mockWords } from '@/db/mock/word.mock';
import * as schema from '@/db/schema';
import { SourceType } from '@/enums/sourceType';

export async function seedInitialData() {
  // Quick check to avoid re-seeding - Check for levels as they are core config
  const existingConfig = await db.query.levelConfigs.findFirst();
  if (existingConfig) return;

  await db.transaction(async (tx) => {
    const now = new Date().toISOString();

    console.log('Seeding game configurations...');

    // 1. Level Configs (Progress ladder)
    const levels = [
      { level: 1, requiredXp: 0, title: 'Novice', createdAt: now, updatedAt: now },
      { level: 2, requiredXp: 100, title: 'Apprentice', createdAt: now, updatedAt: now },
      { level: 3, requiredXp: 300, title: 'Scholar', createdAt: now, updatedAt: now },
      { level: 4, requiredXp: 600, title: 'Memory Keeper', createdAt: now, updatedAt: now },
      { level: 5, requiredXp: 1000, title: 'Grandmaster', createdAt: now, updatedAt: now },
    ];
    for (const lvl of levels) {
      await tx.insert(schema.levelConfigs).values(lvl).onConflictDoNothing();
    }

    // 2. XP Configs (Rewards system)
    const xpSettings = [
      {
        id: 'xp-lesson',
        sourceType: SourceType.LessonComplete,
        baseXp: 50,
        variableXp: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'xp-review',
        sourceType: SourceType.ReviewComplete,
        baseXp: 20,
        variableXp: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'xp-streak',
        sourceType: SourceType.StreakBonus,
        baseXp: 15,
        variableXp: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const xp of xpSettings) {
      await tx.insert(schema.xpConfigs).values(xp).onConflictDoNothing();
    }

    console.log('Seeding core content...');

    // 3. Palaces
    for (const p of mockPalaces) {
      await tx
        .insert(schema.palaces)
        .values({
          ...p,
          unlockedAt: p.isLocked === false ? now : null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }

    // 4. Locations
    for (const l of mockLocations) {
      await tx
        .insert(schema.locations)
        .values({
          ...l,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }

    // 5. Lessons
    for (const ls of mockLessons) {
      await tx
        .insert(schema.lessons)
        .values({
          ...ls,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }

    // 6. Words
    for (const w of mockWords) {
      await tx
        .insert(schema.words)
        .values({
          ...w,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }

    console.log('Seeding user profile and stats...');

    // 7. User
    await tx
      .insert(schema.users)
      .values({
        id: MOCK_USER.id,
        displayName: MOCK_USER.displayName,
        avatarUrl: MOCK_USER.avatarUrl ?? null,
        email: MOCK_USER.email ?? 'player@example.com',
        totalXp: MOCK_USER.totalXp ?? 0,
        level: MOCK_USER.level ?? 1,
        isPremium: false,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    // 8. User Stats (Essential for the dashboard)
    await tx
      .insert(schema.userStats)
      .values({
        userId: MOCK_USER.id,
        lessonsCompleted: 0,
        wordsLearned: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    // 9. Initial Milestones (Locked achievements)
    const initialMilestones = [
      {
        id: 'ms-first-lesson',
        key: 'first_lesson_completed',
        title: 'First Step',
        description: 'Complete your first memory palace lesson.',
        conditionType: 'lessons_completed' as const,
        conditionValue: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ms-level-5',
        key: 'reach_level_5',
        title: 'High Five',
        description: 'Reach player level 5.',
        conditionType: 'level' as const,
        conditionValue: 5,
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const ms of initialMilestones) {
      await tx.insert(schema.milestones).values(ms).onConflictDoNothing();
    }

    console.log('Seeding complete.');
  });
}
