import { CommonHeader } from '@/components/CommonHeader';
import { useAuth } from '@/contexts/AuthProvider';
import LoadingView from '@/components/LoadingView';
import { useFeatureLimits } from '@/hooks/useFeatureLimits';
import { usePalaceList } from '@/hooks/usePalace';
import { useUserState } from '@/contexts/UserStateContext';
import { Palace } from '@/types/palace';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { PalaceCard } from './PalaceCard';

export default function PalaceListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { limits } = useFeatureLimits();
  const { userState, updateState } = useUserState();
  const { data: palaces = [], isLoading, isRefetching, refetch } = usePalaceList();

  const canUseCustomPalaces = user?.isPremium;
  const view = user?.isPremium ? userState.ui.palaceListTab : 'official';
  const officialPalaces = useMemo(
    () => palaces.filter((p) => !p.isCustom || p.createdBy !== user?.id),
    [palaces, user?.id]
  );
  const customPalaces = useMemo(
    () => palaces.filter((p) => p.isCustom && p.createdBy === user?.id),
    [palaces, user?.id]
  );
  const shownPalaces = view === 'official' ? officialPalaces : customPalaces;
  const canCreateMoreCustomPalaces = customPalaces.length < limits.customPalaces;

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

  if (isLoading && palaces.length === 0) return <LoadingView />;

  return (
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
            onPress={handlePalacePress}
          />
        )}
      />
    </View>
  );
}
