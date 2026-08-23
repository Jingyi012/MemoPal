import { AppImage } from '@/components/AppImage';
import type { Location } from '@/features/palace/shared/types/palace.types';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, MapPin, Route, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { PalaceTrainingJourneyDots } from './PalaceTrainingJourneyDots';

interface Props {
  location: Location;
  currentStep: number;
  locationsCount: number;
}

export const PalaceTrainingLocationCard: React.FC<Props> = ({
  location,
  currentStep,
  locationsCount,
}) => {
  const locationDescription =
    location.description?.trim() || 'Observe the key object, lighting, and shape in this spot.';

  return (
    <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <View className="relative h-72">
        <AppImage source={{ uri: location.imageUrl }} className="h-full w-full" contentFit="cover" />
        <LinearGradient
          colors={['rgba(15,23,42,0.08)', 'rgba(15,23,42,0.8)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View className="absolute left-4 top-4 flex-row items-center gap-2 rounded-full bg-teal-600/95 px-3 py-1.5 shadow-lg">
          <MapPin size={16} color="white" />
          <Text className="text-sm font-medium text-white">Stop {currentStep + 1}</Text>
        </View>
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10">
          <Text className="text-xs font-medium uppercase tracking-wide text-slate-200">
            Location {currentStep + 1} of {locationsCount}
          </Text>
          <Text className="mt-1 text-2xl font-semibold text-white">{location.name}</Text>
        </View>
      </View>

      <View className="gap-4 p-5">
        <View className="rounded-2xl bg-slate-50 p-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Eye size={16} color="#334155" />
            <Text className="text-sm font-semibold text-slate-800">What To Visualize</Text>
          </View>
          <Text className="text-sm leading-6 text-slate-600">{locationDescription}</Text>
        </View>

        <View className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Sparkles size={16} color="#0f766e" />
            <Text className="text-sm font-semibold text-teal-900">Memory Prompt</Text>
          </View>
          <Text className="text-sm leading-6 text-teal-700">
            Attach one vivid action and one emotion to this location. Stronger imagery improves
            recall speed.
          </Text>
        </View>

        <View className="rounded-2xl bg-slate-100 p-4">
          <View className="mb-3 flex-row items-center gap-2">
            <Route size={16} color="#334155" />
            <Text className="text-sm font-semibold text-slate-700">Palace Journey</Text>
          </View>
          <PalaceTrainingJourneyDots currentStep={currentStep} locationsCount={locationsCount} />
        </View>
      </View>
    </View>
  );
};
