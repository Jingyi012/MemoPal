import { authApi } from '@/features/auth/api/auth';
import { AUTH_STORAGE_KEY } from '@/features/auth/constants/auth';
import type { User } from '@/features/profile/types/users';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CURRENT_USER_KEYS } from '@/features/profile/hooks/useCurrentUser';

export interface SaveAvatarAppearancePayload {
  source: 'companion' | 'photo';
  avatarId?: string | null;
  avatarUrl?: string | null;
  frameId?: string | null;
  decorationId?: string | null;
  outfitId?: string | null;
}

export function useSaveAvatarAppearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveAvatarAppearancePayload) => authApi.saveAvatarAppearance(payload),
    onSuccess: async (user: User) => {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      queryClient.setQueryData(CURRENT_USER_KEYS.all, user);
    },
  });
}
