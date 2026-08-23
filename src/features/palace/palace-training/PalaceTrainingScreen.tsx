import LoadingView from '@/components/LoadingView';
import { StepNavigationFooter } from '@/components/StepNavigationFooter';
import { PalaceTrainingHeader } from '@/features/palace/palace-training/components/PalaceTrainingHeader';
import { PalaceTrainingLocationCard } from '@/features/palace/palace-training/components/PalaceTrainingLocationCard';
import { usePalaceTrainingModel } from '@/features/palace/palace-training/hooks/usePalaceTrainingModel';
import type { CustomPalaceData } from '@/features/palace/shared/types/palace.types';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

interface Props {
  palaceId: string;
  customPalace?: CustomPalaceData | null;
  palaceName?: string;
}

export const PalaceTrainingScreen: React.FC<Props> = (props) => {
  const {
    locations,
    displayName,
    currentStep,
    isLastStep,
    isLoading,
    handleNext,
    handlePrevious,
  } = usePalaceTrainingModel(props);

  if (isLoading && locations.length === 0) {
    return <LoadingView description="loading palace..." />;
  }

  if (locations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No locations found for this palace.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <PalaceTrainingHeader
        palaceName={displayName}
        locationsCount={locations.length}
        currentStep={currentStep}
      />

      <ScrollView className="flex-1 p-6">
        <PalaceTrainingLocationCard
          location={locations[currentStep]}
          currentStep={currentStep}
          locationsCount={locations.length}
        />
      </ScrollView>

      <StepNavigationFooter
        onPrevious={currentStep === 0 ? undefined : handlePrevious}
        onNext={handleNext}
        nextLabel={isLastStep ? 'Completed' : 'Next'}
      />
    </View>
  );
};
