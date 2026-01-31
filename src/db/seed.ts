import { MOCK_USER } from '@/contexts/AuthProvider';
import { db } from '@/db/client';
import { mockLessons } from '@/db/mock/lesson.mock';
import { mockLocations } from '@/db/mock/location.mock';
import { mockPalaces } from '@/db/mock/palace.mock';
import { mockWords } from '@/db/mock/word.mock';
import * as schema from '@/db/schema';

export async function seedInitialData() {
  // Quick check to avoid re-seeding
  const existing = await db.query.palaces.findFirst();

  if (existing) return;

  await db.transaction(async (tx) => {
    const now = new Date().toISOString();

    // Palaces
    for (const p of mockPalaces) {
      await tx
        .insert(schema.palaces)
        .values({
          ...p,
          createdAt: p.createdAt ?? now,
          updatedAt: p.updatedAt ?? now,
          lastSyncedAt: p.lastSyncedAt ?? null,
        })
        .onConflictDoNothing();
    }

    // Locations
    for (const l of mockLocations) {
      await tx
        .insert(schema.locations)
        .values({
          ...l,
          createdAt: l.createdAt ?? now,
          updatedAt: l.updatedAt ?? now,
        })
        .onConflictDoNothing();
    }

    // Lessons
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

    // Words
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

    // Optional: seed a local mock user & unlock beginner
    await tx
      .insert(schema.users)
      .values({
        id: MOCK_USER.id,
        displayName: MOCK_USER.name,
        avatarUrl: MOCK_USER.avatar ?? null,
        totalXp: MOCK_USER.xp ?? 0,
        level: MOCK_USER.level ?? 1,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    await tx
      .insert(schema.userPalaces)
      .values({
        id: `${MOCK_USER.id}-beginner`,
        userId: MOCK_USER.id,
        palaceId: 'beginner',
        unlockedAt: now,
      })
      .onConflictDoNothing();
  });
}
