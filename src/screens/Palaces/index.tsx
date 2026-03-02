import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
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
  const { user } = useCurrentUser();
  const { userState, updateState } = useUserState();
  const { data: palaces = [], isLoading, isRefetching, refetch } = usePalaceList();

  const isPremium = !!user?.isPremium;
  const view = isPremium ? userState.ui.palaceListTab : 'official';
  const officialPalaces = useMemo(() => palaces.filter((p) => !p.isCustom), [palaces]);
  const customPalaces = useMemo(() => palaces.filter((p) => p.isCustom), [palaces]);
  const shownPalaces = view === 'official' ? officialPalaces : customPalaces;

  const setView = (next: 'official' | 'custom') =>
    updateState({ ui: { ...userState.ui, palaceListTab: next } });

  const handlePalacePress = (palace: Palace) => {
    if (!palace) return;
    if (palace.isLocked) {
      if (palace.isPremium) router.push('/premium');
      return;
    }
    router.push(`/palaces/${palace.id}`);
  };

  if (isLoading && palaces.length === 0) return <LoadingView />;

  return (
    <View className="flex-1 bg-gray-50">
      <CommonHeader
        title="Memory Palaces"
        description={<Text className="text-sm text-teal-100">Choose a palace to start training</Text>}
        hideBackButton
        showNotification
        actions={isPremium ? [{ icon: Plus, onPress: () => router.push('/palaces/create') }] : []}
      />

      <View className="px-4 pb-2 pt-3">
        <View className="mb-2 rounded-2xl bg-slate-200 p-1 flex-row">
          <Text
            onPress={() => setView('official')}
            className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold ${view === 'official' ? 'bg-white text-slate-900' : 'text-slate-600'}`}>
            Official ({officialPalaces.length})
          </Text>
          {isPremium ? (
            <Text
              onPress={() => setView('custom')}
              className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold ${view === 'custom' ? 'bg-white text-slate-900' : 'text-slate-600'}`}>
              Custom ({customPalaces.length})
            </Text>
          ) : null}
        </View>

        {!isPremium ? (
          <View className="mb-3 rounded-xl bg-amber-50 p-3">
            <Text className="text-xs text-amber-700">Upgrade to Premium to create and manage custom palaces.</Text>
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
          <PalaceCard palace={item} isCompleted={item.isLocked} userXP={item.requiredXp} onPress={handlePalacePress} />
        )}
      />
    </View>
  );
}
