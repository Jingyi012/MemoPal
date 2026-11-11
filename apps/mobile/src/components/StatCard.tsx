import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import { getBaseCardClassName } from '@/components/BaseCard';
import React from 'react';
import { View } from 'react-native';
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
      className={getBaseCardClassName({
        className: 'flex-1 items-center rounded-xl p-3',
        padding: 'none',
      })}
      onPress={navigate}
      disabled={!isClickable}>
      <View className={`mb-2 h-8 w-8 items-center justify-center rounded-full ${bgClass}`}>
        {icon}
      </View>

      <Text className="mb-1 text-[#6B6A80]" style={appTextStyles.caption}>{label}</Text>
      <Text className="text-[#2B2A3D]" style={{ fontFamily: fontFamilies.bodyBold }}>{value ?? '-'}</Text>
    </AnimatedPressable>
  );
};
