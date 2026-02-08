import { CommonHeader } from '@/components/CommonHeader';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

interface HeaderProps {
  palaceName: string;
  locationsCount: number;
  currentStep: number;
}

export const PalaceTraningHeader: React.FC<HeaderProps> = ({
  palaceName,
  locationsCount,
  currentStep,
}) => {
  const progress = ((currentStep + 1) / locationsCount) * 100;

  return (
    <CommonHeader
      title={palaceName}
      description={
        <Text className="text-sm text-teal-100">Learn your {locationsCount} locations</Text>
      }
      backAction={() => router.back()}
      additionalContent={
        <View className="space-y-2">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs text-teal-100">Progress</Text>
            <Text className="text-xs text-white">
              {currentStep + 1} / {locationsCount}
            </Text>
          </View>
          <View className="h-2.5 overflow-hidden rounded-full bg-white/20">
            <LinearGradient
              colors={[Colors.green400, Colors.emerald500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: `${progress}%`,
                height: '100%',
                borderRadius: 999,
              }}
            />
          </View>
        </View>
      }
    />
  );
};
