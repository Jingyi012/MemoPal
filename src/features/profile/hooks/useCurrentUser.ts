import { AUTH_STORAGE_KEY } from '@/features/auth/constants/auth';
import { authApi } from '@/features/auth/api/auth';
import type { User } from '@/features/profile/types/users';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';

export const CURRENT_USER_KEYS = {
  all: ['current-user'] as const,
};

export function useCurrentUser() {
  const query = useQuery({
    queryKey: CURRENT_USER_KEYS.all,
    queryFn: async (): Promise<User | null> => {
      try {
        const remote = await authApi.getCurrentProfile();
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(remote));
        return remote;
      } catch (error) {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) throw error;

        try {
          const fromStorage = JSON.parse(raw) as User;
          return {
            ...fromStorage,
            email: fromStorage.email ?? 'player@example.com',
            level: Math.max(1, fromStorage.level ?? 1),
            totalXp: Math.max(0, fromStorage.totalXp ?? 0),
          };
        } catch {
          throw error;
        }
      }
    },
    staleTime: 1000 * 60 * 2,
    networkMode: 'online',
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
