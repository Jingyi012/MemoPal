import type { MemoryModuleDefinition } from '@/core/memory';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  module: MemoryModuleDefinition;
  onPress: () => void;
};

export function MemoryModuleCard({ module, onPress }: Props) {
  const icon = module.key === 'number-peg' ? '🕯️' : '🏰';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${module.title}`}
      onPress={onPress}
      className="mb-3 rounded-2xl border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4"
      style={{ boxShadow: '0px 2px 8px rgba(43, 42, 61, 0.08)' }}>
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#EEE9FF]">
          <Text className="text-2xl">{icon}</Text>
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-[#2B2A3D]">{module.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-[#6B6A80]">{module.description}</Text>
        </View>
        <Text className="ml-2 text-lg text-[#7A68E0]">›</Text>
      </View>
    </Pressable>
  );
}
