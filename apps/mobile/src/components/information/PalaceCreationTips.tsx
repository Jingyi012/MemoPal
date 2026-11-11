import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import React from 'react';
import { View } from 'react-native';

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
      <Text className="mb-2 text-[#247B67]" style={[appTextStyles.body, { fontFamily: fontFamilies.bodySemibold }]}>💡 Palace Creation Tips</Text>

      <View className="space-y-2">
        <Text className="text-[#3B6F60]" style={appTextStyles.label}>• Choose familiar places for better recall</Text>
        <Text className="text-[#3B6F60]" style={appTextStyles.label}>
          • Upload photos of each location for better visualization
        </Text>
        <Text className="text-[#3B6F60]" style={appTextStyles.label}>• Make locations distinct and memorable</Text>
        <Text className="text-[#3B6F60]" style={appTextStyles.label}>• Follow a logical path through your palace</Text>
        <Text className="text-[#3B6F60]" style={appTextStyles.label}>
          • Choose {minLocations}-{maxLocations} locations based on your needs
        </Text>
        <Text className="text-[#3B6F60]" style={appTextStyles.label}>
          • You can create unlimited palaces for different topics
        </Text>
      </View>
    </View>
  );
};
