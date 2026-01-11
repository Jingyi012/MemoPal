import data from '@/utils/mock/palaces.json';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList } from 'react-native';
import { PalaceCard } from './PalaceCard';

const palaces = data.palaces;
export const PalaceGrid: React.FC = () => {
  const router = useRouter();

  const handlePalacePress = (palaceId: string) => {
    const palace = palaces.find((p) => p.id === palaceId);
    if (!palace) return;

    if (palace.locked) {
      if (palace.isPremium && palace.id === 'custom') {
        router.push('/premium');
      } else if (palace.isPremium) {
        router.push('/premium');
      }
      return;
    }

    router.push(`/palaces/${palace.id}`);
  };

  return (
    <FlatList
      data={palaces}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <PalaceCard
          palace={item}
          isCompleted={item.locked}
          userXP={item.requiredXP}
          onPress={handlePalacePress}
        />
      )}
    />
  );
};
