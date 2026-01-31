import { AppImage } from '@/components/AppImage';
import { Location } from '@/types/palace';
import { MapPin } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { JourneyDots } from './JourneyDots';

interface LocationCardProps {
  location: Location;
  currentStep: number;
  locationsCount: number;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  currentStep,
  locationsCount,
}) => {
  return (
    <View className="overflow-hidden rounded-3xl bg-white shadow-lg">
      <View className="relative h-64">
        <AppImage source={{ uri: location.imageUrl }} className="h-full w-full" />
        <View className="absolute left-4 top-4 flex-row items-center gap-2 rounded-full bg-teal-600 px-3 py-1.5 shadow-lg">
          <MapPin size={16} color="white" />
          <Text className="text-sm text-white">Location {currentStep + 1}</Text>
        </View>
      </View>

      <View className="p-6">
        <Text className="mb-2 text-lg text-slate-800">{location.name}</Text>
        <Text className="mb-6 text-slate-600">{location.description}</Text>

        {/* Memory tip */}
        <View className="mb-6 rounded-2xl bg-teal-50 p-4">
          <Text className="mb-2 text-teal-900">💡 Memory Tip</Text>
          <Text className="text-sm text-teal-700">
            Visualize this location clearly in your mind. Notice the details, colors, and how it
            makes you feel. The more vivid, the better you'll remember!
          </Text>
        </View>

        <Text className="mb-3 text-sm text-slate-600">Your Palace Journey</Text>
        <JourneyDots currentStep={currentStep} locationsCount={locationsCount} />
      </View>
    </View>
  );
};
