import { ActionSheet } from '@/components/ActionSheet';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { usePalaceListModel } from '@/features/palace/palace-list/hooks/usePalaceListModel';
import { PalaceCard } from '@/features/palace/palace-list/components/PalaceCard';
import { ArrowRight, MapPinned, Plus, Trash2 } from 'lucide-react-native';
import React from 'react';
import { FlatList, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import AnimatedPressable from '@/components/AnimatedPressable';
import { Href, useRouter } from 'expo-router';

export default function PalaceListScreen() {
  const router = useRouter();
  const {
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
  } = usePalaceListModel();

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
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: error instanceof Error ? error.message : 'Unable to delete palace right now.',
      });
    }
  };

  if (isLoading && shownPalaces.length === 0) return <LoadingView />;

  return (
    <>
      <View className="flex-1 bg-gray-50">
        <CommonHeader
          title="Memory Palaces"
          description={<Text className="text-sm text-teal-100">Choose a palace to start training</Text>}
          hideBackButton
          showNotification
          actions={
            canUseCustomPalaces && canCreateMoreCustomPalaces
              ? [{ icon: Plus, onPress: handleCreateCustomPalace }]
              : []
          }
        />

        <View className="px-4 pb-2 pt-3">
          <AnimatedPressable
            onPress={() => router.push('/palaces/create-memory' as Href)}
            className="mb-3 flex-row items-center rounded-2xl border-2 border-violet-200 bg-violet-50 p-4">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-violet-200">
              <MapPinned size={22} color="#6d28d9" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-extrabold text-slate-900">Create a scene-based memory</Text>
              <Text className="mt-1 text-xs font-semibold text-slate-500">Place your items on loci over one connected image</Text>
            </View>
            <ArrowRight size={19} color="#6d28d9" />
          </AnimatedPressable>
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
              {view === 'custom' ? 'No custom palaces yet. Tap + to create one.' : 'No palaces available.'}
            </Text>
          }
          renderItem={({ item }) => (
            <PalaceCard
              palace={item}
              isDisabled={isPalaceDisabled(item)}
              deletable={view === 'custom' && isOwnedCustomPalace(item)}
              onDelete={setDeleteTarget}
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
        description={deleteTarget ? `This will remove \"${deleteTarget.name}\" and cannot be undone.` : undefined}
        actionLabel={deletePalace.isPending ? 'Deleting...' : 'Delete Palace'}
        variant="destructive"
        Icon={Trash2}
      />
    </>
  );
}
