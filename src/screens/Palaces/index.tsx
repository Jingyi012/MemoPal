import { CommonHeader } from '@/components/CommonHeader';
import { ActionSheet } from '@/components/ActionSheet';
import { useAuth } from '@/contexts/AuthProvider';
import LoadingView from '@/components/LoadingView';
import { useFeatureLimits } from '@/hooks/useFeatureLimits';
import { usePalaceList, usePalaceMutations } from '@/hooks/usePalace';
import { useUserState } from '@/contexts/UserStateContext';
import { Palace } from '@/types/palace';
import { useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { PalaceCard } from './PalaceCard';

export default function PalaceListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { limits } = useFeatureLimits();
  const { userState, updateState } = useUserState();
  const { deletePalace } = usePalaceMutations();
  const [deleteTarget, setDeleteTarget] = useState<Palace | null>(null);
  const { data: palaces = [], isLoading, isRefetching, refetch } = usePalaceList();
  const currentUserId = user?.id;
  const isOwnedCustomPalace = (palace: Palace) =>
    palace.isCustom && (!palace.createdBy || palace.createdBy === currentUserId);
  const officialPalaces = useMemo(
    () =>
      palaces.filter(
        (p) => !(p.isCustom && (!p.createdBy || p.createdBy === currentUserId))
      ),
    [palaces, currentUserId]
  );
  const customPalaces = useMemo(
    () =>
      palaces.filter(
        (p) => p.isCustom && (!p.createdBy || p.createdBy === currentUserId)
      ),
    [palaces, currentUserId]
  );

  const customPalaceLimit = Math.max(0, limits.customPalaces ?? 0);
  const canUseCustomPalaces = customPalaceLimit > 0 || customPalaces.length > 0;
  const view = canUseCustomPalaces ? userState.ui.palaceListTab : 'official';
  const shownPalaces = view === 'official' ? officialPalaces : customPalaces;
  const canCreateMoreCustomPalaces = customPalaces.length < customPalaceLimit;

  const setView = (next: 'official' | 'custom') =>
    updateState({ ui: { ...userState.ui, palaceListTab: next } });

  const isPremiumUpsellPalace = (palace: Palace) => palace.isLocked && palace.isPremium;
  const isPalaceDisabled = (palace: Palace) => palace.isLocked && !isPremiumUpsellPalace(palace);

  const handlePalacePress = (palace: Palace) => {
    if (!palace) return;
    if (isPalaceDisabled(palace)) {
      return;
    }
    if (isPremiumUpsellPalace(palace)) {
      router.push('/premium');
      return;
    }
    router.push(`/palaces/${palace.id}`);
  };

  const handleDeletePalace = async () => {
    if (!deleteTarget) return;

    try {
      await deletePalace.mutateAsync(deleteTarget.id);
      Toast.show({
        type: 'success',
        text1: 'Palace deleted',
        text2: `"${deleteTarget.name}" was removed.`,
      });
      setDeleteTarget(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to delete palace right now.';
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: message,
      });
    }
  };

  if (isLoading && palaces.length === 0) return <LoadingView />;

  return (
    <>
      <View className="flex-1 bg-gray-50">
        <CommonHeader
          title="Memory Palaces"
          description={
            <Text className="text-sm text-teal-100">Choose a palace to start training</Text>
          }
          hideBackButton
          showNotification
          actions={
            canUseCustomPalaces && canCreateMoreCustomPalaces
              ? [{ icon: Plus, onPress: () => router.push('/palaces/create') }]
              : []
          }
        />
        <View className="px-4 pb-2 pt-3">
          {canUseCustomPalaces ? (
            <View className="mb-2 flex-row rounded-2xl bg-slate-200 p-1">
              <Text
                onPress={() => setView('official')}
                className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold ${view === 'official' ? 'bg-white text-slate-900' : 'text-slate-600'}`}>
                Featured ({officialPalaces.length})
              </Text>

              <Text
                onPress={() => setView('custom')}
                className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold ${view === 'custom' ? 'bg-white text-slate-900' : 'text-slate-600'}`}>
                My Palaces ({customPalaces.length})
              </Text>
            </View>
          ) : null}
        </View>

        <FlatList
          data={shownPalaces}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          ListEmptyComponent={
            <Text className="px-2 py-6 text-center text-slate-500">
              {view === 'custom'
                ? 'No custom palaces yet. Tap + to create one.'
                : 'No palaces available.'}
            </Text>
          }
          renderItem={({ item }) => (
            <PalaceCard
              palace={item}
              isCompleted={!item.isLocked && Boolean(item.unlockedAt)}
              isDisabled={isPalaceDisabled(item)}
              deletable={view === 'custom' && isOwnedCustomPalace(item)}
              onDelete={(palace) => setDeleteTarget(palace)}
              onPress={handlePalacePress}
            />
          )}
        />
      </View>

      <ActionSheet
        isVisible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onAction={handleDeletePalace}
        title="Delete Palace?"
        description={
          deleteTarget
            ? `This will remove \"${deleteTarget.name}\" and cannot be undone.`
            : undefined
        }
        actionLabel={deletePalace.isPending ? 'Deleting...' : 'Delete Palace'}
        variant="destructive"
        Icon={Trash2}
      />
    </>
  );
}
