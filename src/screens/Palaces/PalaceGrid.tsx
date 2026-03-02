import LoadingView from '@/components/LoadingView';
import { usePalaceList } from '@/hooks/usePalace';
import { Palace } from '@/types/palace';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { PalaceCard } from './PalaceCard';

export const PalaceGrid: React.FC = () => {
  const router = useRouter();
  const { data: palaces = [], isLoading, isRefetching, refetch } = usePalaceList();

  const handlePalacePress = (palace: Palace) => {
    if (!palace) return;

    if (palace.isLocked) {
      if (palace.isPremium) {
        router.push('/premium');
      }
      return;
    }

    router.push(`/palaces/${palace.id}`);
  };

  if (isLoading && palaces.length === 0) {
    return <LoadingView />;
  }

  const sortedPalaces = useMemo(() => {
    const predefined = palaces.filter((p) => !p.isCustom);
    const custom = palaces.filter((p) => p.isCustom);
    return [...predefined, ...custom];
  }, [palaces]);

  return (
    <FlatList
      data={sortedPalaces}
      keyExtractor={(item) => item.id}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View className="mb-4 rounded-2xl bg-teal-50 p-4">
          <Text className="text-sm font-semibold text-teal-800">Predefined palaces appear first. Custom palaces you create (premium) appear after them.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <PalaceCard
          palace={item}
          isCompleted={item.isLocked}
          userXP={item.requiredXp}
          onPress={handlePalacePress}
        />
      )}
    />
  );
};
