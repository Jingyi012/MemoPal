/** Temporary adapter for the existing palace review action. */
import AnimatedPressable from '@/components/AnimatedPressable';
import { getBaseCardClassName } from '@/components/BaseCard';
import { ChevronRight, Compass, MapPin } from 'lucide-react-native';
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
    <View className="mt-4">
      <AnimatedPressable
        onPress={onStartPalaceTraining}
        className={getBaseCardClassName({
          className: 'w-full overflow-hidden border-teal-100 p-4',
          padding: 'none',
        })}>
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-teal-100">
            <Compass size={20} color="#0f766e" />
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-800">Review Palace Route</Text>
            <Text className="text-sm text-slate-600">
              Walk through {locationCount} locations before starting lessons.
            </Text>
          </View>

          <ChevronRight size={18} color="#64748b" />
        </View>

        <View className="mt-3 flex-row items-center gap-2">
          <MapPin size={14} color="#0f766e" />
          <Text className="text-xs font-medium text-teal-700">{locationCount} stops to review</Text>
        </View>
      </AnimatedPressable>
    </View>
  );
};
