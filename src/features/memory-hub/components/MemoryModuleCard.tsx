import type { MemoryModuleDefinition } from '@/core/memory';
import { Brain, Hash } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  module: MemoryModuleDefinition;
  onPress: () => void;
};

export function MemoryModuleCard({ module, onPress }: Props) {
  const Icon = module.key === 'number-peg' ? Hash : Brain;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${module.title}`}
      onPress={onPress}
      className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
          <Icon size={24} color="#0f766e" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-slate-900">{module.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-500">{module.description}</Text>
        </View>
        <Text className="ml-2 text-lg text-teal-700">›</Text>
      </View>
    </Pressable>
  );
}
