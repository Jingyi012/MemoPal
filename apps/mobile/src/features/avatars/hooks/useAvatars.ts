import { avatarsApi } from '../api/avatars';
import { useQuery } from '@tanstack/react-query';

export const AVATAR_KEYS = { all: ['avatars'] as const };

export function useAvatars() {
  const query = useQuery({
    queryKey: AVATAR_KEYS.all,
    queryFn: avatarsApi.list,
    staleTime: 1000 * 60 * 10,
  });

  return {
    avatars: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function getEquippedAvatar(
  avatars: readonly import('../types/avatar').AvatarDefinition[],
  selectedAvatarId: string | null | undefined,
  level: number,
) {
  const unlocked = avatars.filter((avatar) => avatar.requiredLevel <= level);
  return unlocked.find((avatar) => avatar.id === selectedAvatarId) ?? unlocked[0] ?? avatars[0];
}
