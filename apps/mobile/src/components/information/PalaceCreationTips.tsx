import React from 'react';
import { Text, View } from 'react-native';

interface PalaceCreationTipsProps {
  minLocations: number;
  maxLocations: number;
}

export const PalaceCreationTips: React.FC<PalaceCreationTipsProps> = ({
  minLocations,
  maxLocations,
}) => {
  return (
    <View className="rounded-2xl border-2 border-line-mint bg-tint-mint p-5">
      <Text className="mb-2 text-base font-semibold text-[#247B67]">💡 Palace Creation Tips</Text>

      <View className="space-y-2">
        <Text className="text-sm text-[#3B6F60]">• Choose familiar places for better recall</Text>
        <Text className="text-sm text-[#3B6F60]">
          • Upload photos of each location for better visualization
        </Text>
        <Text className="text-sm text-[#3B6F60]">• Make locations distinct and memorable</Text>
        <Text className="text-sm text-[#3B6F60]">• Follow a logical path through your palace</Text>
        <Text className="text-sm text-[#3B6F60]">
          • Choose {minLocations}-{maxLocations} locations based on your needs
        </Text>
        <Text className="text-sm text-[#3B6F60]">
          • You can create unlimited palaces for different topics
        </Text>
      </View>
    </View>
  );
};
