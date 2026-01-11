import { PalaceTrainingScreen } from '@/screens/Palaces/Training';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const Training = () => {
  const { palaceId } = useLocalSearchParams();
  return <PalaceTrainingScreen palaceId={palaceId as string} />;
};

export default Training;
