import { CommonHeader } from '@/components/CommonHeader';
import React from 'react';
import { Text, View } from 'react-native';
import { PalaceGrid } from './PalaceGrid';

export default function PalaceListScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <CommonHeader
        title="Memory Palaces"
        description={
          <Text className="text-sm text-teal-100">Choose a palace to start training</Text>
        }
        hideBackButton={true}
        showNotification
      />
      <PalaceGrid />
    </View>
  );
}
