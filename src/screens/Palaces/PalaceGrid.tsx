import LoadingView from '@/components/LoadingView';
import { usePalaceList } from '@/hooks/usePalace';
import { Palace } from '@/types/palace';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList } from 'react-native';
import { PalaceCard } from './PalaceCard';

export const PalaceGrid: React.FC = () => {
  const router = useRouter();
  const { palaces, isLoading, isRefreshing, refresh } = usePalaceList();

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

  return (
    <FlatList
      data={palaces}
      keyExtractor={(item) => item.id}
      onRefresh={refresh}
      refreshing={isRefreshing}
      contentContainerStyle={{ padding: 16 }}
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
