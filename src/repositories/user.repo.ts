import { db } from '@/db/client';
import * as schema from '@/db/schema';
import * as levelConfigService from '@/services/levelConfig.service';
import { User } from '@/types/users';
import { eq } from 'drizzle-orm';

export type LocalUserAccess = {
  userId?: string;
  level: number;
  isPremium: boolean;
};

interface UserRepository {
  getCurrent(): Promise<{ id: string; totalXp: number; isPremium: boolean } | null>;
  getLocalUserAccess(): Promise<LocalUserAccess>;
  getProfileLocal(
    userId: string
  ): Promise<{
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
    totalXp: number;
    level: number;
    isPremium: boolean;
  } | null>;
  setPremium(userId: string, isPremium: boolean): Promise<void>;
  updateProfileLocal(payload: {
    id: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string | null;
  }): Promise<void>;
  upsertFromRemote(user: User): Promise<void>;
  clearLocalAuthUser(): Promise<void>;
}

export function createUserRepository(): UserRepository {
  return {
    async getCurrent() {
      const user = await db.query.users.findFirst();
      if (!user) return null;
      return { id: user.id, totalXp: user.totalXp, isPremium: user.isPremium };
    },

    async getLocalUserAccess() {
      const user = await db.query.users.findFirst({
        columns: { id: true, totalXp: true, level: true, isPremium: true },
      });
      if (!user) {
        return { level: 1, isPremium: false };
      }

      let level = Math.max(1, user.level ?? 1);
      try {
        level = await levelConfigService.getLevelByXp(Math.max(0, user.totalXp), user.level);
      } catch {
        level = Math.max(1, user.level ?? 1);
      }

      return {
        userId: user.id,
        level: Math.max(1, level),
        isPremium: Boolean(user.isPremium),
      };
    },

    async getProfileLocal(userId: string) {
      const user = await db.query.users.findFirst({
        where: (fields, { eq }) => eq(fields.id, userId),
      });
      if (!user) return null;
      return {
        id: user.id,
        displayName: user.displayName,
        email: user.email!,
        avatarUrl: user.avatarUrl,
        totalXp: user.totalXp,
        level: user.level,
        isPremium: user.isPremium,
      };
    },

    async setPremium(userId: string, isPremium: boolean) {
      await db
        .update(schema.users)
        .set({ isPremium, updatedAt: new Date().toISOString() })
        .where(eq(schema.users.id, userId));
    },

    async updateProfileLocal(payload: {
      id: string;
      displayName?: string;
      email?: string;
      avatarUrl?: string | null;
    }) {
      await db
        .update(schema.users)
        .set({
          displayName: payload.displayName,
          email: payload.email,
          avatarUrl: payload.avatarUrl ?? null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.users.id, payload.id));
    },

    async upsertFromRemote(user: User) {
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        await tx
          .insert(schema.users)
          .values({
            id: user.id,
            displayName: user.displayName,
            email: user.email ?? null,
            avatarUrl: user.avatarUrl ?? null,
            totalXp: Math.max(0, user.totalXp ?? 0),
            level: Math.max(1, user.level ?? 1),
            isPremium: !!user.isPremium,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: now,
            isDeleted: false,
            deletedAt: null,
          })
          .onConflictDoUpdate({
            target: schema.users.id,
            set: {
              displayName: user.displayName,
              email: user.email ?? null,
              avatarUrl: user.avatarUrl ?? null,
              totalXp: Math.max(0, user.totalXp ?? 0),
              level: Math.max(1, user.level ?? 1),
              isPremium: !!user.isPremium,
              updatedAt: now,
              lastSyncedAt: now,
              isDeleted: false,
              deletedAt: null,
            },
          });

        const stats = user.stats;
        if (!stats) return;

        await tx
          .insert(schema.userStats)
          .values({
            userId: user.id,
            lessonsCompleted: Math.max(0, stats.lessonsCompleted ?? 0),
            wordsLearned: Math.max(0, stats.wordsLearned ?? 0),
            currentStreak: Math.max(0, stats.currentStreak ?? 0),
            longestStreak: Math.max(0, stats.longestStreak ?? 0),
            lastActiveDate: stats.lastActiveDate ?? null,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: now,
            isDeleted: false,
            deletedAt: null,
          })
          .onConflictDoUpdate({
            target: schema.userStats.userId,
            set: {
              lessonsCompleted: Math.max(0, stats.lessonsCompleted ?? 0),
              wordsLearned: Math.max(0, stats.wordsLearned ?? 0),
              currentStreak: Math.max(0, stats.currentStreak ?? 0),
              longestStreak: Math.max(0, stats.longestStreak ?? 0),
              lastActiveDate: stats.lastActiveDate ?? null,
              updatedAt: now,
              lastSyncedAt: now,
              isDeleted: false,
              deletedAt: null,
            },
          });
      });
    },

    async clearLocalAuthUser() {
      await db.transaction(async (tx) => {
        await tx.delete(schema.userStats);
        await tx.delete(schema.users);
      });
    },
  };
}
