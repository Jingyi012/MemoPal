import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemorySet } from '@/features/memory-sets/types/memorySet.types';
import { ArrowRight, Hash, MapPinned } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

type ContinueSessionCardProps = {
  memorySet: Pick<MemorySet, 'title' | 'techniqueKey' | 'items' | 'updatedAt'>;
  onPress: () => void;
};

export function ContinueSessionCard({ memorySet, onPress }: ContinueSessionCardProps) {
  const isPalace = memorySet.techniqueKey === 'palace';

  return (
    <View className="mt-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-bold text-[#2B2A3D]">Continue where you left off</Text>
        <Text className="text-xs font-bold uppercase tracking-[0.7px] text-[#A19DAE]">Recent</Text>
      </View>
      <AnimatedPressable
        onPress={onPress}
        className="rounded-[22px] border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4">
        <View className="flex-row items-center">
          <View className={`h-12 w-12 items-center justify-center rounded-2xl ${isPalace ? 'bg-[#EEE9FF]' : 'bg-[#FFF0F4]'}`}>
            {isPalace ? <MapPinned size={23} color="#6654D9" /> : <Hash size={23} color="#C83A63" />}
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <Text className={`text-[10px] font-black uppercase tracking-[0.8px] ${isPalace ? 'text-[#6654D9]' : 'text-[#C83A63]'}`}>
              {isPalace ? 'Memory Palace' : 'Number Peg'}
            </Text>
            <Text numberOfLines={1} className="mt-1 text-[17px] font-black text-[#2B2A3D]">
              {memorySet.title}
            </Text>
            <Text className="mt-1 text-xs font-semibold text-[#6B6A80]">
              {memorySet.items.length} items · Updated {formatMemorySetDate(memorySet.updatedAt)}
            </Text>
          </View>
          <ArrowRight size={20} color="#A19DAE" />
        </View>
        <View className="mt-3 flex-row items-center justify-center rounded-xl bg-[#FFC93C] px-3 py-2.5">
          <Text className="text-xs font-black text-[#2B2A3D]">Open session details</Text>
          <ArrowRight size={15} color="#2B2A3D" style={{ marginLeft: 6 }} />
        </View>
      </AnimatedPressable>
    </View>
  );
}

function formatMemorySetDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
