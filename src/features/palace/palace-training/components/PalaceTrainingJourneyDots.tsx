import { Check } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

interface Props {
  currentStep: number;
  locationsCount: number;
  maxSingleRow?: number;
}

export const PalaceTrainingJourneyDots: React.FC<Props> = ({
  currentStep,
  locationsCount,
  maxSingleRow = 3,
}) => {
  const Dot = ({ index }: { index: number }) => (
    <View
      key={index}
      className={`h-8 w-8 items-center justify-center rounded-full ${
        index < currentStep ? 'bg-green-400' : index === currentStep ? 'bg-teal-600' : 'bg-gray-200'
      } ${index !== locationsCount - 1 ? 'mb-2 mr-2' : ''}`}>
      {index < currentStep ? (
        <Check size={16} color="white" />
      ) : (
        <Text className={`text-xs ${index === currentStep ? 'text-white' : 'text-black'}`}>
          {index + 1}
        </Text>
      )}
    </View>
  );

  if (locationsCount > maxSingleRow) {
    return (
      <View className="flex-row flex-wrap pb-2">
        {Array.from({ length: locationsCount }).map((_, index) => (
          <Dot index={index} key={index} />
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="pb-2 flex-row">
      {Array.from({ length: locationsCount }).map((_, index) => (
        <Dot index={index} key={index} />
      ))}
    </ScrollView>
  );
};
