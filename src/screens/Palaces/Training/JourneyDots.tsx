import { Check } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

interface JourneyDotsProps {
  currentStep: number;
  locationsCount: number;
  maxSingleRow?: number; // optional, default 15
}

export const JourneyDots: React.FC<JourneyDotsProps> = ({
  currentStep,
  locationsCount,
  maxSingleRow = 3,
}) => {
  const Dot = ({ idx }: { idx: number }) => (
    <View
      key={idx}
      className={`h-8 w-8 items-center justify-center rounded-full ${
        idx < currentStep ? 'bg-green-400' : idx === currentStep ? 'bg-teal-600' : 'bg-gray-200'
      } ${idx !== locationsCount - 1 ? 'mb-2 mr-2' : ''}`}>
      {idx < currentStep ? (
        <Check size={16} color="white" />
      ) : (
        <Text className={`text-xs ${idx === currentStep ? 'text-white' : 'text-black'}`}>
          {idx + 1}
        </Text>
      )}
    </View>
  );

  // Use wrap mode if locations exceed maxSingleRow
  if (locationsCount > maxSingleRow) {
    return (
      <View className="flex-row flex-wrap pb-2">
        {Array.from({ length: locationsCount }).map((_, idx) => (
          <Dot idx={idx} key={idx} />
        ))}
      </View>
    );
  }

  // Otherwise, single row scroll
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="pb-2 flex-row">
      {Array.from({ length: locationsCount }).map((_, idx) => (
        <Dot idx={idx} key={idx} />
      ))}
    </ScrollView>
  );
};
