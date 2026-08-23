import { AUTH_STORAGE_KEY } from '@/features/auth/constants/auth';
import { db } from '@/db/client';
import type { User } from '@/features/profile/types/users';
import { getEffectiveCurrentStreak } from '@/features/gamification/shared/utils/streak';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';

export const CURRENT_USER_KEYS = {
  all: ['current-user'] as const,
};

export function useCurrentUser() {
  const query = useQuery({
    queryKey: CURRENT_USER_KEYS.all,
    queryFn: async (): Promise<User | null> => {
      const user = await db.query.users.findFirst();
      if (!user) {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;

        try {
          const fromStorage = JSON.parse(raw) as User;
          return {
            ...fromStorage,
            email: fromStorage.email ?? 'player@example.com',
            level: Math.max(1, fromStorage.level ?? 1),
            totalXp: Math.max(0, fromStorage.totalXp ?? 0),
          };
        } catch {
          return null;
        }
      }

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
              currentStreak: getEffectiveCurrentStreak(stats.currentStreak, stats.lastActiveDate),
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
