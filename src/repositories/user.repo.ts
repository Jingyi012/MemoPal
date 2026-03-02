import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

interface UserRepository {
  getCurrent(): Promise<{ id: string; totalXp: number; isPremium: boolean } | null>;
  getProfileLocal(userId: string): Promise<{ id: string; displayName: string; email: string; avatarUrl?: string | null; totalXp: number; level: number; isPremium: boolean } | null>;
  setPremium(userId: string, isPremium: boolean): Promise<void>;
  updateProfileLocal(payload: { id: string; displayName?: string; email?: string; avatarUrl?: string | null }): Promise<void>;
}

export function createUserRepository(): UserRepository {
  return {
    async getCurrent() {
      const user = await db.query.users.findFirst();
      if (!user) return null;
      return { id: user.id, totalXp: user.totalXp, isPremium: user.isPremium };
    },

    async getProfileLocal(userId: string) {
      const user = await db.query.users.findFirst({ where: (fields, { eq }) => eq(fields.id, userId) });
      if (!user) return null;
      return {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
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

    async updateProfileLocal(payload: { id: string; displayName?: string; email?: string; avatarUrl?: string | null }) {
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
  };
}
