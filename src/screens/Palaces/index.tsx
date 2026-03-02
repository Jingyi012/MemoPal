import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePalaceList } from '@/hooks/usePalace';
import { Palace } from '@/types/palace';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { PalaceCard } from './PalaceCard';

export default function PalaceListScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data: palaces = [], isLoading, isRefetching, refetch } = usePalaceList();
  const [view, setView] = useState<'official' | 'custom'>('official');

  const isPremium = !!user?.isPremium;
  const officialPalaces = useMemo(() => palaces.filter((p) => !p.isCustom), [palaces]);
  const customPalaces = useMemo(() => palaces.filter((p) => p.isCustom), [palaces]);
  const shownPalaces = view === 'official' ? officialPalaces : customPalaces;

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
        <View className="mb-3 flex-row gap-2">
          <View className="flex-1">
            <Text
              onPress={() => setView('official')}
              className={`rounded-xl px-4 py-3 text-center font-semibold ${view === 'official' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              Official Palaces
            </Text>
          </View>
          {isPremium ? (
            <View className="flex-1">
              <Text
                onPress={() => setView('custom')}
                className={`rounded-xl px-4 py-3 text-center font-semibold ${view === 'custom' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                My Custom Palaces
              </Text>
            </View>
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
        ListEmptyComponent={<Text className="px-2 py-6 text-center text-slate-500">{view === 'custom' ? 'No custom palaces yet. Tap + to create one.' : 'No palaces available.'}</Text>}
        renderItem={({ item }) => (
          <PalaceCard palace={item} isCompleted={item.isLocked} userXP={item.requiredXp} onPress={handlePalacePress} />
        )}
      />
    </View>
  );
}
