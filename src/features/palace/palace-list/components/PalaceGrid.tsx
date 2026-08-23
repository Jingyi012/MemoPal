import LoadingView from '@/components/LoadingView';
import { usePalaceList } from '@/features/palace/shared/hooks';
import { PalaceCard } from '@/features/palace/palace-list/components/PalaceCard';
import type { Palace } from '@/features/palace/shared/types/palace.types';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { SectionList, Text, View } from 'react-native';

export const PalaceGrid: React.FC = () => {
  const router = useRouter();
  const { data: palaces = [], isLoading, isRefetching, refetch } = usePalaceList();
  const isPremiumUpsellPalace = (palace: Palace) => palace.isLocked && palace.isPremium;
  const isPalaceDisabled = (palace: Palace) => palace.isLocked && !isPremiumUpsellPalace(palace);

  const handlePalacePress = (palace: Palace) => {
    if (isPalaceDisabled(palace)) return;
    if (isPremiumUpsellPalace(palace)) {
      router.push('/premium');
      return;
    }
    router.push(`/palaces/${palace.id}`);
  };

  const sections = useMemo(
    () => [
      { title: 'Predefined Palaces', data: palaces.filter((palace) => !palace.isCustom) },
      { title: 'Your Custom Palaces', data: palaces.filter((palace) => palace.isCustom) },
    ],
    [palaces]
  );

  if (isLoading && palaces.length === 0) {
    return <LoadingView />;
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View className="mb-3 mt-2 rounded-xl bg-slate-100 px-3 py-2">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <PalaceCard palace={item} isDisabled={isPalaceDisabled(item)} onPress={handlePalacePress} />
      )}
      ListHeaderComponent={
        <View className="mb-3 rounded-2xl bg-teal-50 p-4">
          <Text className="text-sm font-semibold text-teal-800">
            Official palaces come first. Custom palace creation is available based on your feature
            limits.
          </Text>
        </View>
      }
    />
  );
};
