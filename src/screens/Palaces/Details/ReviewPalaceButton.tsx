import AnimatedPressable from '@/components/AnimatedPressable';
import { CheckCircle2, MapPin } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  onStartPalaceTraining: () => void;
  locationCount?: number;
}

export const ReviewPalaceButton: React.FC<Props> = ({
  onStartPalaceTraining,
  locationCount = 0,
}) => {
  return (
    <View className="mt-3">
      <AnimatedPressable onPress={onStartPalaceTraining} className="w-full rounded-xl bg-white p-3">
        <View className={`flex-row items-center gap-3`}>
          {/* Icon circle */}
          <View className="h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 size={20} color="#16a34a" />
          </View>

          {/* Text */}
          <View className="flex-1">
            <Text className="text-base text-text">Review Palace Locations</Text>
            <Text className="text-sm text-text-muted">
              Refresh your memory of {locationCount} locations
            </Text>
          </View>

          {/* Trailing icon */}
          <MapPin size={16} color="#9ca3af" />
        </View>
      </AnimatedPressable>
    </View>
  );
};
