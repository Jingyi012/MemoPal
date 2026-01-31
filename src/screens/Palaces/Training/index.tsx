import LoadingView from '@/components/LoadingView';
import { StepNavigationFooter } from '@/components/StepNavigationFooter';
import { useUserState } from '@/contexts/UserStateContext';
import { usePalace } from '@/hooks/usePalace';
import { CustomPalaceData } from '@/types/palace';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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

  const { data, isLoading } = usePalace(palaceId);

  const displayName = customPalace?.name || palaceName || 'Memory Palace';

  const palaceLocations = useMemo(() => {
    return data?.locations ?? [];
  }, [data]);

  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === palaceLocations.length - 1;

  const onComplete = () => {
    // award xp, analytics, etc
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
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (isLoading && palaceLocations.length === 0) {
    return <LoadingView description="loading palace..."></LoadingView>;
  }

  if (palaceLocations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No locations found for this palace.</Text>
      </View>
    );
  }

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
