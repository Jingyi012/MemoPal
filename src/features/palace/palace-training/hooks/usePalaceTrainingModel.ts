import { useUserState } from '@/contexts/UserStateContext';
import { usePalace } from '@/features/palace/shared/hooks';
import type { CustomPalaceData } from '@/features/palace/shared/types/palace.types';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

type Props = {
  palaceId: string;
  customPalace?: CustomPalaceData | null;
  palaceName?: string;
};

export function usePalaceTrainingModel({ palaceId, customPalace, palaceName }: Props) {
  const router = useRouter();
  const { completeOnboarding } = useUserState();
  const { data, isLoading } = usePalace(palaceId);
  const [currentStep, setCurrentStep] = useState(0);

  const locations = useMemo(() => data?.locations ?? [], [data]);
  const displayName = customPalace?.name || palaceName || 'Memory Palace';
  const isLastStep = currentStep === locations.length - 1;

  const handleNext = useCallback(() => {
    if (currentStep < locations.length - 1) {
      setCurrentStep((previous) => previous + 1);
      return;
    }

    completeOnboarding();
    router.back();
  }, [completeOnboarding, currentStep, locations.length, router]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((previous) => previous - 1);
    }
  }, [currentStep]);

  return {
    locations,
    displayName,
    currentStep,
    isLastStep,
    isLoading,
    handleNext,
    handlePrevious,
  };
}
