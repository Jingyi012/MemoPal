import { avatarsApi } from '../api/avatars';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { isMomoPortrait } from '../momoPortraits';

export const AVATAR_KEYS = { all: ['avatars'] as const };

export function useAvatars() {
  const query = useQuery({
    queryKey: AVATAR_KEYS.all,
    queryFn: avatarsApi.list,
    staleTime: 1000 * 60 * 10,
  });
  const avatars = useMemo(() => query.data?.filter((avatar) => isMomoPortrait(avatar.key)) ?? [], [query.data]);

  return {
    avatars,
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
  return unlocked.find((avatar) => avatar.id === selectedAvatarId) ?? unlocked.at(-1) ?? avatars[0];
}
