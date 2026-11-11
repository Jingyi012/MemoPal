import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appTextStyles, fontFamilies } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemorySet } from '@/features/memory-sets/types/memorySet.types';
import { ArrowRight } from '@/core/icons';
import React from 'react';
import { View } from 'react-native';

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
            <Text style={{ fontSize: appArtworkSizes.medium, lineHeight: appArtworkSizes.medium + 4 }}>{isPalace ? '🏰' : '🕯️'}</Text>
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <Text className="text-ink-soft" style={[appTextStyles.caption, { fontFamily: fontFamilies.bodyBold }]}>
              Continue where you left off
            </Text>
            <Text numberOfLines={1} className="mt-[1px] text-ink" style={[appTextStyles.label, { fontFamily: fontFamilies.displayExtraBold }]}>
              {memorySet.title}
            </Text>
            <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
              <View className="h-full rounded-full bg-accent-violet" style={{ width: `${progress}%` }} />
            </View>
            <Text className="mt-1 text-ink-soft" style={[appTextStyles.caption, { fontFamily: fontFamilies.bodyBold }]}>
              {memorySet.status === 'draft' ? 'Keep building' : `${memorySet.items.length} items ready to recall`}
            </Text>
          </View>
          <ArrowRight size={20} color="#A19DAE" />
        </View>
      </AnimatedPressable>
    </View>
  );
}
