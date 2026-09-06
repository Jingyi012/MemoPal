import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemorySet } from '@/features/memory-sets/types/memorySet.types';
import { ArrowRight } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

type ContinueSessionCardProps = {
  memorySet: Pick<MemorySet, 'title' | 'techniqueKey' | 'items' | 'updatedAt' | 'status'>;
  onPress: () => void;
};

export function ContinueSessionCard({ memorySet, onPress }: ContinueSessionCardProps) {
  const isPalace = memorySet.techniqueKey === 'palace';
  const progress = memorySet.status === 'draft' ? 25 : 100;

  return (
    <View className="mt-4">
      <AnimatedPressable
        onPress={onPress}
        className="flex-row items-center rounded-[18px] border-2 border-line bg-surface p-[13px]"
        style={{ boxShadow: '0px 8px 20px rgba(43,42,61,0.08)' }}>
        <View className="flex-row items-center">
          <View className={`h-12 w-12 items-center justify-center rounded-2xl ${isPalace ? 'bg-tint-violet' : 'bg-tint-berry'}`}>
            <Text className="text-2xl">{isPalace ? '🏰' : '🕯️'}</Text>
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <Text className="text-[10.5px] font-bold text-ink-soft">
              Continue where you left off
            </Text>
            <Text numberOfLines={1} className="mt-[1px] text-[14px] font-black text-ink">
              {memorySet.title}
            </Text>
            <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
              <View className="h-full rounded-full bg-accent-violet" style={{ width: `${progress}%` }} />
            </View>
            <Text className="mt-1 text-[10.5px] font-bold text-ink-soft">
              {memorySet.status === 'draft' ? 'Keep building' : `${memorySet.items.length} items ready to recall`}
            </Text>
          </View>
          <ArrowRight size={20} color="#A19DAE" />
        </View>
      </AnimatedPressable>
    </View>
  );
}
