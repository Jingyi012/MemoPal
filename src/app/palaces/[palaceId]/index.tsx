import PalaceDetailScreen from '@/screens/Palaces/Details';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const PalaceDetails = () => {
  const { palaceId } = useLocalSearchParams();

  return <PalaceDetailScreen palaceId={palaceId as string} />;
};

export default PalaceDetails;
