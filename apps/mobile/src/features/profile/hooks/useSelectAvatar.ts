import { authApi } from '@/features/auth/api/auth';
import { AUTH_STORAGE_KEY } from '@/features/auth/constants/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CURRENT_USER_KEYS } from './useCurrentUser';

export function useSelectAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (avatarId: string | null) => authApi.selectAvatar(avatarId),
    onSuccess: async (user) => {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      queryClient.setQueryData(CURRENT_USER_KEYS.all, user);
    },
  });
}
