import { useQuery } from '@tanstack/react-query';
import { appearanceApi } from '../api/appearance';
import type { AppearanceDefinition, EquippedAppearance } from '../types/appearance';

export const APPEARANCE_KEYS = { all: ['appearance-items'] as const };

export function useAppearance() {
  const query = useQuery({
    queryKey: APPEARANCE_KEYS.all,
    queryFn: appearanceApi.list,
    staleTime: 1000 * 60 * 10,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function getEquippedAppearance(
  items: readonly AppearanceDefinition[],
  selectedFrameId: string | null | undefined,
  selectedDecorationId: string | null | undefined,
  selectedOutfitId: string | null | undefined,
  level: number,
): EquippedAppearance {
  const unlocked = items.filter((item) => item.requiredLevel <= level && item.isActive);
  return {
    frame: unlocked.find((item) => item.itemType === 'frame' && item.id === selectedFrameId),
    decoration: unlocked.find((item) => item.itemType === 'decoration' && item.id === selectedDecorationId),
    outfit: unlocked.find((item) => item.itemType === 'outfit' && item.id === selectedOutfitId),
  };
}
