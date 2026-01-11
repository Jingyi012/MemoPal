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
    <View className="rounded-2xl bg-blue-50 p-5">
      <Text className="mb-2 text-base font-semibold text-blue-900">💡 Palace Creation Tips</Text>

      <View className="space-y-2">
        <Text className="text-sm text-blue-800">• Choose familiar places for better recall</Text>
        <Text className="text-sm text-blue-800">
          • Upload photos of each location for better visualization
        </Text>
        <Text className="text-sm text-blue-800">• Make locations distinct and memorable</Text>
        <Text className="text-sm text-blue-800">• Follow a logical path through your palace</Text>
        <Text className="text-sm text-blue-800">
          • Choose {minLocations}-{maxLocations} locations based on your needs
        </Text>
        <Text className="text-sm text-blue-800">
          • You can create unlimited palaces for different topics
        </Text>
      </View>
    </View>
  );
};
