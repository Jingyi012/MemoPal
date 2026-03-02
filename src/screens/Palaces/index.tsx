import { CommonHeader } from '@/components/CommonHeader';
import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import CreatePalaceSheet from './CreatePalaceSheet';
import { PalaceGrid } from './PalaceGrid';

export default function PalaceListScreen() {
  const [showCreatePalace, setShowCreatePalace] = useState(false);

  return (
    <View className="flex-1 bg-gray-50">
      <CommonHeader
        title="Memory Palaces"
        description={<Text className="text-sm text-teal-100">Choose a palace to start training</Text>}
        hideBackButton={true}
        showNotification
        actions={[{ icon: Plus, onPress: () => setShowCreatePalace(true) }]}
      />
      <PalaceGrid />
      <CreatePalaceSheet visible={showCreatePalace} onClose={() => setShowCreatePalace(false)} />
    </View>
  );
}
