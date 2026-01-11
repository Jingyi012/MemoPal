import React from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';

interface StatCardProps {
  label: string;
  value?: number;
  icon: React.ReactNode;
  bgClass: string;
  navigate?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, bgClass, navigate }) => {
  const isClickable = typeof navigate === 'function';

  return (
    <AnimatedPressable
      aria-disabled={!isClickable}
      className={`flex-1 items-center rounded-xl bg-white p-3`}
      onPress={navigate}
      disabled={!isClickable}>
      <View className={`mb-2 h-8 w-8 items-center justify-center rounded-full ${bgClass}`}>
        {icon}
      </View>

      <Text className="mb-1 text-xs text-text-muted">{label}</Text>
      <Text className="text-text">{value ?? '-'}</Text>
    </AnimatedPressable>
  );
};
