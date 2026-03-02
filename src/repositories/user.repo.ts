import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

interface UserRepository {
  getCurrent(): Promise<{ id: string; totalXp: number; isPremium: boolean } | null>;
  setPremium(userId: string, isPremium: boolean): Promise<void>;
}

export function createUserRepository(): UserRepository {
  return {
    async getCurrent() {
      const user = await db.query.users.findFirst();
      if (!user) return null;
      return { id: user.id, totalXp: user.totalXp, isPremium: user.isPremium };
    },

    async setPremium(userId: string, isPremium: boolean) {
      await db
        .update(schema.users)
        .set({ isPremium, updatedAt: new Date().toISOString() })
        .where(eq(schema.users.id, userId));
    },
  };
}
