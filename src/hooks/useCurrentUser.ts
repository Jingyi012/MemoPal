import { db } from '@/db/client';
import type { User } from '@/types/users';
import { useQuery } from '@tanstack/react-query';

export const CURRENT_USER_KEYS = {
  all: ['current-user'] as const,
};

export function useCurrentUser() {
  const query = useQuery({
    queryKey: CURRENT_USER_KEYS.all,
    queryFn: async (): Promise<User | null> => {
      const user = await db.query.users.findFirst();
      if (!user) return null;

      const stats = await db.query.userStats.findFirst({
        where: (fields, { eq }) => eq(fields.userId, user.id),
      });

      return {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? undefined,
        email: user.email ?? 'player@example.com',
        totalXp: user.totalXp,
        level: user.level,
        isPremium: user.isPremium,
        stats: stats
          ? {
              lessonsCompleted: stats.lessonsCompleted,
              wordsLearned: stats.wordsLearned,
              currentStreak: stats.currentStreak,
              longestStreak: stats.longestStreak,
              lastActiveDate: stats.lastActiveDate,
            }
          : undefined,
      };
    },
    staleTime: 0,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
