import AnimatedPressable from '@/components/AnimatedPressable';
import { getBaseCardClassName } from '@/components/BaseCard';
import React from 'react';
import { Text } from 'react-native';

type QuickActionCardProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function QuickActionCard({ title, subtitle, onPress }: QuickActionCardProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      className={getBaseCardClassName({
        className: 'mb-2 border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4',
        padding: 'none',
      })}>
      <Text className="font-bold text-[#2B2A3D]">{title}</Text>
      <Text className="mt-0.5 text-xs text-[#6B6A80]">{subtitle}</Text>
    </AnimatedPressable>
  );
}
