import { StepNavigationFooter } from '@/components/StepNavigationFooter';
import { useUserState } from '@/contexts/UserStateContext';
import { CustomPalaceData } from '@/types/palace';
import data from '@/utils/mock/palaces.json';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { LocationCard } from './LocationCard';
import { PalaceTraningHeader } from './PalaceTraningHeader';

interface PalaceTrainingProps {
  palaceId: string;
  customPalace?: CustomPalaceData | null;
  palaceName?: string;
}

export const PalaceTrainingScreen: React.FC<PalaceTrainingProps> = ({
  palaceId,
  customPalace,
  palaceName,
}) => {
  const { completeOnboarding } = useUserState();
  const router = useRouter();

  const palaceLocations = data.locations.filter((x) => x.palaceId === palaceId);

  const displayName = customPalace?.name || palaceName || 'Memory Palace';

  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === palaceLocations.length - 1;

  const onComplete = () => {
    // award xp,
  };

  const handleNext = () => {
    if (currentStep < palaceLocations.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeOnboarding();
      onComplete();
      router.back();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <PalaceTraningHeader
        palaceName={displayName}
        locationsCount={palaceLocations.length}
        currentStep={currentStep}
      />

      <ScrollView className="flex-1 p-6">
        <LocationCard
          location={palaceLocations[currentStep]}
          currentStep={currentStep}
          locationsCount={palaceLocations.length}
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
