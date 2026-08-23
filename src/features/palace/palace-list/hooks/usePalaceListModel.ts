import { useAuth } from '@/contexts/AuthProvider';
import { useUserState } from '@/contexts/UserStateContext';
import { usePalaceList, usePalaceMutations } from '@/features/palace/shared/hooks';
import { useFeatureLimits } from '@/features/subscription/hooks/useFeatureLimits';
import type { Palace } from '@/features/palace/shared/types/palace.types';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

export type PalaceListView = 'official' | 'custom';

export function usePalaceListModel() {
  const router = useRouter();
  const { user } = useAuth();
  const { limits } = useFeatureLimits();
  const { userState, updateState } = useUserState();
  const { deletePalace } = usePalaceMutations();
  const [deleteTarget, setDeleteTarget] = useState<Palace | null>(null);
  const { data: palaces = [], isLoading, isRefetching, refetch } = usePalaceList();

  const currentUserId = user?.id;
  const isOwnedCustomPalace = useCallback(
    (palace: Palace) =>
      palace.isCustom && (!palace.createdBy || palace.createdBy === currentUserId),
    [currentUserId]
  );

  const officialPalaces = useMemo(
    () => palaces.filter((palace) => !isOwnedCustomPalace(palace)),
    [palaces, isOwnedCustomPalace]
  );
  const customPalaces = useMemo(
    () => palaces.filter((palace) => isOwnedCustomPalace(palace)),
    [palaces, isOwnedCustomPalace]
  );

  const customPalaceLimit = Math.max(0, limits.customPalaces ?? 0);
  const canUseCustomPalaces = customPalaceLimit > 0 || customPalaces.length > 0;
  const view: PalaceListView = canUseCustomPalaces ? userState.ui.palaceListTab : 'official';
  const shownPalaces = view === 'official' ? officialPalaces : customPalaces;
  const canCreateMoreCustomPalaces = customPalaces.length < customPalaceLimit;

  const setView = (nextView: PalaceListView) => {
    void updateState({ ui: { ...userState.ui, palaceListTab: nextView } });
  };

  const isPremiumUpsellPalace = (palace: Palace) => palace.isLocked && palace.isPremium;
  const isPalaceDisabled = (palace: Palace) =>
    palace.isLocked && !isPremiumUpsellPalace(palace);

  const handlePalacePress = (palace: Palace) => {
    if (isPalaceDisabled(palace)) return;

    if (isPremiumUpsellPalace(palace)) {
      router.push('/premium');
      return;
    }

    router.push(`/palaces/${palace.id}`);
  };

  const handleCreateCustomPalace = () => {
    router.push('/palaces/create');
  };

  return {
    palaces,
    officialPalaces,
    customPalaces,
    shownPalaces,
    view,
    canUseCustomPalaces,
    canCreateMoreCustomPalaces,
    isLoading,
    isRefetching,
    refetch,
    deletePalace,
    deleteTarget,
    setDeleteTarget,
    isOwnedCustomPalace,
    isPalaceDisabled,
    handlePalacePress,
    handleCreateCustomPalace,
    setView,
  };
}
